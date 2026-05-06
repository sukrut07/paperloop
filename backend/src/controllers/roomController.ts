import { Request, Response } from 'express';
import { Batch, Room, TrackingStatus, UserRole } from '../models';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function roomActor(req: AuthenticatedRequest) {
  return req.authUser?.institutionName || req.authUser?.name || 'Paperloop member';
}

function memberFromUser(req: AuthenticatedRequest) {
  return {
    id: req.authUser?.uid || `member-${Date.now()}`,
    name: roomActor(req),
    role: req.authUser?.role || 'institution',
    email: req.authUser?.email || 'member@paperloop.local',
    phone: req.authUser?.phone,
  };
}

function verificationFor(actor: string, role: UserRole) {
  return {
    status: 'verified',
    verifiedBy: actor,
    verifiedRole: role,
    verifiedAt: new Date().toISOString(),
  };
}

function proofKindForRole(role: UserRole) {
  if (role === 'ngo') return 'ngo-proof';
  if (role === 'recycler') return 'recycler-proof';
  return 'institution-proof';
}

function roomRecipients(room: any) {
  return (room.members || [])
    .map((member: any) => (typeof member === 'string' ? `${member}@paperloop.local` : member.email))
    .filter(Boolean);
}

function notificationFor(room: any, title: string, message: string) {
  return {
    id: createId('notification'),
    roomCode: room.code,
    title,
    message,
    recipients: roomRecipients(room),
    channel: 'email',
    emailStatus: 'sent',
    createdAt: new Date().toISOString(),
  };
}

async function generateRoomCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await Room.exists({ code });
    if (!existing) return code;
  }

  throw new Error('Could not generate unique room code');
}

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, roomName, shipmentName, shipmentTitle, paperType, estimatedWeight, pickupLocation, pickupDeadline } = req.body;
    if (!req.authUser?._id || !name || !shipmentName || !paperType || !estimatedWeight || !pickupLocation || !pickupDeadline) {
      return res.status(400).json({
        error: 'room name, shipment name, paper type, estimated weight, pickup location, pickup deadline, and authentication are required',
      });
    }

    const normalizedPickupLocation =
      typeof pickupLocation === 'string'
        ? { lat: 18.5204, lng: 73.8567, address: pickupLocation }
        : pickupLocation;

    const code = await generateRoomCode();
    const room = await Room.create({
      code,
      roomId: `ROOM-${Date.now().toString(36).toUpperCase()}`,
      institutionId: req.authUser._id,
      name: roomName || name,
      createdByUid: req.authUser.uid,
      members: [memberFromUser(req)],
      batches: [],
      shipmentName: shipmentName || shipmentTitle,
      shipmentTitle: shipmentTitle || shipmentName,
      paperType,
      estimatedWeight: Number(estimatedWeight),
      pickupLocation: normalizedPickupLocation,
      pickupDeadline,
      shipmentStatus: 'Created',
      recyclerResponse: 'pending',
      invitedPeople: [],
      messages: [
        {
          id: createId('message'),
          author: 'Paperloop',
          body: 'Room created. Chat, batches, members, tracking, shipment updates, and documents now live here.',
          kind: 'announcement',
          createdAt: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: createId('timeline'),
          actor: 'Paperloop',
          role: 'system',
          status: 'Created',
          kind: 'status',
          message: 'Shipment room created with room ID and 6-digit invite code.',
          createdAt: new Date().toISOString(),
        },
      ],
      documents: [],
      notifications: [],
    });

    return res.status(201).json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const joinRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || !req.authUser?.uid) return res.status(400).json({ error: 'code and authentication are required' });

    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const member = memberFromUser(req);
    const members = room.members || [];
    if (!members.some((item: any) => (typeof item === 'string' ? item : item.id) === member.id)) {
      room.members = [...members, member as any];
      room.timeline = [
        ...((room.timeline || []) as any[]),
        {
          id: createId('timeline'),
          actor: member.name,
          role: member.role,
          kind: 'invite',
          message: `${member.name} joined the shipment room.`,
          createdAt: new Date().toISOString(),
        },
      ] as any;
      await room.save();
    }

    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate('institutionId');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const listRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.authUser?.role === 'institution' && req.authUser?._id) {
      filter.institutionId = req.authUser._id;
    }
    const rooms = await Room.find(filter).sort({ updatedAt: -1 }).limit(100);
    return res.json(rooms);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const addRoomMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { member, method = 'email' } = req.body;
    if (!member) return res.status(400).json({ error: 'member is required' });

    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const createdAt = new Date().toISOString();
    const structuredMember = {
      id: String(member).toLowerCase().replace(/\W+/g, '-'),
      name: String(member),
      role: method === 'code' ? 'recycler' : 'institution',
      email: method === 'email' ? String(member) : `${String(member).toLowerCase().replace(/\s+/g, '.')}@paperloop.local`,
      phone: '+91 90000 00000',
    };
    const notification = notificationFor(room, 'Room invite added', `${roomActor(req)} invited ${member} to ${room.name}.`);

    if (!room.members.some((item: any) => (typeof item === 'string' ? item : item.id) === structuredMember.id)) {
      room.members = [...(room.members || []), structuredMember as any];
    }
    room.invitedPeople = Array.from(new Set([...(room.invitedPeople || []), String(member)]));
    room.timeline = [
      ...((room.timeline || []) as any[]),
      {
        id: createId('timeline'),
        actor: roomActor(req),
        role: req.authUser?.role || 'institution',
        kind: 'invite',
        message: `Invited ${member} by ${method}.`,
        createdAt,
      },
    ] as any;
    room.notifications = [notification as any, ...((room.notifications || []) as any[])];
    await room.save();

    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const addRoomMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { author, body, kind = 'message', attachmentName, attachmentUrl } = req.body;
    if (!body) return res.status(400).json({ error: 'message body is required' });

    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    room.messages = [
      ...((room.messages || []) as any[]),
      {
        id: createId('message'),
        author: author || roomActor(req),
        body,
        kind,
        attachmentName,
        attachmentUrl,
        createdAt: new Date().toISOString(),
      },
    ] as any;
    await room.save();

    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const selectRecycler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const recycler = {
      id: req.body.id,
      name: req.body.name,
      role: 'recycler',
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      rating: req.body.rating,
      distanceKm: req.body.distanceKm,
      capacityKgPerDay: req.body.capacityKgPerDay,
    };
    const notification = notificationFor(room, 'Recycler request sent', `${roomActor(req)} requested pickup from ${recycler.name}.`);
    room.selectedRecycler = recycler as any;
    room.selectedRecyclerId = recycler.id;
    room.recyclerResponse = 'pending';
    room.timeline = [
      ...((room.timeline || []) as any[]),
      {
        id: createId('timeline'),
        actor: roomActor(req),
        role: 'institution',
        kind: 'notification',
        message: `Recycler request sent to ${recycler.name}.`,
        createdAt: new Date().toISOString(),
      },
    ] as any;
    room.notifications = [notification as any, ...((room.notifications || []) as any[])];
    await room.save();

    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateRoomShipment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, actor, role, message, proofUrl, proofFileName, documentTitle } = req.body as {
      status: TrackingStatus;
      actor?: string;
      role?: UserRole;
      message?: string;
      proofUrl?: string;
      proofFileName?: string;
      documentTitle?: string;
    };
    if (!status) return res.status(400).json({ error: 'status is required' });

    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const createdAt = new Date().toISOString();
    const actorName = actor || roomActor(req);
    const actorRole = role || req.authUser?.role || 'institution';
    const verification = verificationFor(actorName, actorRole);
    const notification = notificationFor(room, 'Shipment updated', `${actorName}: ${message || `Shipment moved to ${status}`}`);

    room.shipmentStatus = status;
    if (status === 'Accepted') room.recyclerResponse = 'accepted';
    if (status === 'Rejected') room.recyclerResponse = 'rejected';
    if (actorRole === 'recycler' && req.authUser?.uid) {
      const member = memberFromUser(req);
      if (!room.selectedRecycler) {
        room.selectedRecycler = {
          id: req.authUser.uid,
          name: actorName,
          role: 'recycler',
          email: req.authUser.email,
          phone: req.authUser.phone,
          address: req.authUser.location?.address,
        } as any;
        room.selectedRecyclerId = req.authUser.uid;
      }
      if (!room.members.some((item: any) => (typeof item === 'string' ? item : item.id) === member.id)) {
        room.members = [...(room.members || []), member as any];
      }
    }
    room.timeline = [
      ...((room.timeline || []) as any[]),
      {
        id: createId('timeline'),
        actor: actorName,
        role: actorRole,
        status,
        kind: 'status',
        message: message || `Shipment moved to ${status}.`,
        proofRequired: Boolean(proofUrl),
        proofUrl,
        proofFileName,
        verification,
        createdAt,
      },
    ] as any;

    if (proofUrl) {
      room.documents = [
        ...((room.documents || []) as any[]),
        {
          id: createId('doc'),
          title: documentTitle || `${status} proof`,
          ownerRole: actorRole,
          kind: proofKindForRole(actorRole),
          url: proofUrl,
          proofFileName,
          uploadedBy: actorName,
          uploadedAt: createdAt,
          shipmentId: room.code,
          verification,
          createdAt,
        },
      ] as any;
    }
    room.notifications = [notification as any, ...((room.notifications || []) as any[])];
    await room.save();

    if (room.batches?.length) {
      await Batch.updateMany({ batchId: { $in: room.batches } }, { status });
    }

    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
