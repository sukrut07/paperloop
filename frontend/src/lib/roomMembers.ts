import type { Room, RoomMember } from './types';

function memberName(member: string | RoomMember) {
  return typeof member === 'string' ? member : member.name;
}

function memberRole(member: string | RoomMember) {
  return typeof member === 'string' ? 'institution' : member.role;
}

function memberEmail(member: string | RoomMember) {
  return typeof member === 'string' ? '' : member.email;
}

function memberId(member: string | RoomMember) {
  return typeof member === 'string' ? member : member.id;
}

function normalize(value?: string) {
  return (value || '').trim().toLowerCase();
}

export function memberIdentityKey(member: string | RoomMember) {
  const role = normalize(memberRole(member));
  const email = normalize(memberEmail(member));
  const name = normalize(memberName(member));
  const id = normalize(memberId(member));
  if (name) return `${role}:${name}`;
  if (email) return email;
  return id;
}

export function uniqueRoomMembers(room?: Pick<Room, 'members'> | null) {
  const seen = new Set<string>();
  return (room?.members || []).filter((member) => {
    const key = memberIdentityKey(member);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
