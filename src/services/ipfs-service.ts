import { NFTStorage, File } from 'nft.storage';

const client = new NFTStorage({
  token: process.env.NFT_STORAGE_API_KEY || '',
});

export interface IPFSUploadResult {
  cid: string;
  url: string;
  gateway: string;
}

export class IPFSService {
  // Upload a file to IPFS
  static async uploadFile(file: File | Blob, name?: string): Promise<IPFSUploadResult> {
    const nftFile = new File([file], name || 'file', {
      type: file.type,
    });

    const cid = await client.storeBlob(nftFile);
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

    return {
      cid,
      url: `ipfs://${cid}`,
      gateway: `${gateway}${cid}`,
    };
  }

  // Upload JSON metadata to IPFS
  static async uploadJSON(data: Record<string, unknown>): Promise<IPFSUploadResult> {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const cid = await client.storeBlob(blob);
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

    return {
      cid,
      url: `ipfs://${cid}`,
      gateway: `${gateway}${cid}`,
    };
  }

  // Upload profile data (avatar + metadata)
  static async uploadProfile(data: {
    avatar?: File | Blob;
    cover?: File | Blob;
    metadata: Record<string, unknown>;
  }): Promise<{
    avatarCid?: string;
    coverCid?: string;
    metadataCid: string;
  }> {
    const results: {
      avatarCid?: string;
      coverCid?: string;
      metadataCid: string;
    } = {
      metadataCid: '',
    };

    // Upload avatar if provided
    if (data.avatar) {
      const avatarResult = await this.uploadFile(data.avatar, 'avatar');
      results.avatarCid = avatarResult.cid;
      data.metadata.avatar = avatarResult.url;
    }

    // Upload cover if provided
    if (data.cover) {
      const coverResult = await this.uploadFile(data.cover, 'cover');
      results.coverCid = coverResult.cid;
      data.metadata.cover = coverResult.url;
    }

    // Upload metadata
    const metadataResult = await this.uploadJSON(data.metadata);
    results.metadataCid = metadataResult.cid;

    return results;
  }

  // Get IPFS gateway URL
  static getGatewayUrl(cid: string): string {
    if (!cid) return '';
    
    // Handle ipfs:// protocol
    if (cid.startsWith('ipfs://')) {
      cid = cid.replace('ipfs://', '');
    }

    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    return `${gateway}${cid}`;
  }

  // Check if CID is valid
  static isValidCID(cid: string): boolean {
    // Basic CID validation (v0 or v1)
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/.test(cid);
  }

  // Fetch content from IPFS
  static async fetchContent(cid: string): Promise<unknown> {
    const url = this.getGatewayUrl(cid);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.blob();
  }

  // Pin existing CID (if using Pinata)
  static async pinCID(cid: string): Promise<void> {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecret = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecret) {
      console.warn('Pinata credentials not configured');
      return;
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecret,
      },
      body: JSON.stringify({
        hashToPin: cid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pin CID: ${response.statusText}`);
    }
  }
}
