import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  await hre.run("compile");

  const artifact = await hre.artifacts.readArtifact("Paperloop");
  const [from] = await hre.network.provider.request({ method: "eth_accounts", params: [] });

  if (!from) {
    throw new Error("No deployer account configured. Set PRIVATE_KEY in blockchain/.env.");
  }

  const txHash = await hre.network.provider.request({
    method: "eth_sendTransaction",
    params: [{ from, data: artifact.bytecode }],
  });

  let receipt = null;
  while (!receipt) {
    receipt = await hre.network.provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });
    if (!receipt) await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  const address = receipt.contractAddress;
  const chainIdHex = await hre.network.provider.request({ method: "eth_chainId", params: [] });

  const deployment = {
    contract: "Paperloop",
    address,
    txHash,
    chainId: Number.parseInt(chainIdHex, 16),
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.resolve("deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${hre.network.name}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log(`Paperloop deployed to ${address} on ${hre.network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
