import type { OnNameLookupHandler } from '@metamask/snaps-sdk';

const registryToProtocol = {
  "FNS": "Freename",
  "ENS": "Ethereum Name Service",
  "UD": "Unstoppable Domains",
  "BNS": "Base Name Service",
  "ID": "SpaceID",
  "DNAME": "DecentraName"
};

const chainIdToName = {
  "eip155:1": "ethereum",
  "eip155:137": "polygon",
  "eip155:8453": "base",
  "eip155:56": "bsc",
  "eip155:1329": "sei",
  "eip155:42793": "etherlink"
};

/**
 * @param request - The request arguments.
 * @param request.domain - The domain to resolve.
 * @param request.chainId - The CAIP-2 chain ID of the associated network.
 * @returns If successful, an object containing the resolvedAddress. Null otherwise.
 */
export const onNameLookup: OnNameLookupHandler = async (request) => {
  const { chainId, domain } = request;
  const baseURL = "https://apis.freename.io/api/v1/resolver";
  const supportedChains = Object.keys(chainIdToName);
  const supportedRegistries = Object.keys(registryToProtocol);

  if (!domain || !supportedChains.includes(chainId)) {
    return null;
  }

  for (const registry of supportedRegistries) {
    try {
      const response = await fetch(`${baseURL}/${registry}/${domain}`);

      if (!response.ok) {
        continue;
      }

      const resJson = await response.json();

      const resolvedAddress = resJson?.data?.resolvedAddress;
      if (resolvedAddress) {
        const network = resJson?.data?.network?.toLowerCase();
        const protocolName = `${registryToProtocol[registry as keyof typeof registryToProtocol]} (${network})`;

        const protocol = chainIdToName[chainId as keyof typeof chainIdToName] !== network
          ? `⚠️ ${protocolName}`
          : protocolName;

        return {
          resolvedAddresses: [
            {
              resolvedAddress,
              protocol,
              domainName: domain,
            },
          ],
        };
      }
    } catch (error) {
      // resolve failed
      return null;
    }
  }

  return null;
};
