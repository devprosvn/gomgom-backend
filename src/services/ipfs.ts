import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Environment variables validation
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  console.warn('⚠️ Pinata API keys not found in environment variables. IPFS functionality will be limited.');
}

// Type definitions for Pinata responses
export interface PinataFileResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

export interface PinataJSONResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PinataPinListItem {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  date_pinned: string;
  date_unpinned?: string;
  metadata: {
    name?: string;
    keyvalues?: Record<string, any>;
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
}

export interface PinataPinListResponse {
  count: number;
  rows: PinataPinListItem[];
}

export interface PinataError {
  error: {
    reason: string;
    details: string;
  };
}

/**
 * IPFS Service for managing NFT assets via Pinata
 * Handles file uploads, JSON metadata, and listing pinned content
 */
export class IpfsService {
  private static readonly BASE_URL = 'https://api.pinata.cloud';
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

  /**
   * Get default headers for Pinata API requests
   */
  private static getHeaders(): Record<string, string> {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error('Pinata API keys not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY environment variables.');
    }

    return {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
    };
  }

  /**
   * Pin a file to IPFS via Pinata
   * @param filePath Path to the file to upload
   * @param options Optional metadata and pinning options
   * @returns IPFS hash of the uploaded file
   */
  static async pinFileToIPFS(
    filePath: string, 
    options: {
      name?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      // Validate file exists and size
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new Error(`File too large: ${stats.size} bytes. Maximum allowed: ${this.MAX_FILE_SIZE} bytes`);
      }

      const url = `${this.BASE_URL}/pinning/pinFileToIPFS`;
      const data = new FormData();
      
      // Add file to form data
      data.append('file', fs.createReadStream(filePath));
      
      // Add metadata if provided
      if (options.name || options.metadata) {
        const pinataMetadata = {
          name: options.name || path.basename(filePath),
          ...(options.metadata && { keyvalues: options.metadata })
        };
        data.append('pinataMetadata', JSON.stringify(pinataMetadata));
      }

      const response: AxiosResponse<PinataFileResponse> = await axios.post(url, data, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          ...this.getHeaders(),
          ...data.getHeaders(),
        },
        timeout: 120000, // 2 minutes timeout for large files
      });

      console.log(`✅ File pinned to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;

    } catch (error: any) {
      console.error('❌ Error uploading file to Pinata:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Pinata API credentials');
      } else if (error.response?.status === 429) {
        throw new Error('Pinata rate limit exceeded. Please try again later');
      } else if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      } else {
        throw new Error(`Failed to pin file to IPFS: ${error.message}`);
      }
    }
  }

  /**
   * Pin JSON metadata to IPFS via Pinata
   * @param jsonData Object to be uploaded as JSON
   * @param options Optional metadata and pinning options
   * @returns IPFS hash of the uploaded JSON
   */
  static async pinJSONToIPFS(
    jsonData: object,
    options: {
      name?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const url = `${this.BASE_URL}/pinning/pinJSONToIPFS`;
      
      const requestBody = {
        pinataContent: jsonData,
        ...(options.name || options.metadata) && {
          pinataMetadata: {
            name: options.name || 'NFT Metadata',
            ...(options.metadata && { keyvalues: options.metadata })
          }
        }
      };

      const response: AxiosResponse<PinataJSONResponse> = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders(),
        },
        timeout: 30000, // 30 seconds timeout
      });

      console.log(`✅ JSON pinned to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;

    } catch (error: any) {
      console.error('❌ Error uploading JSON to Pinata:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Pinata API credentials');
      } else if (error.response?.status === 429) {
        throw new Error('Pinata rate limit exceeded. Please try again later');
      } else {
        throw new Error(`Failed to pin JSON to IPFS: ${error.message}`);
      }
    }
  }

  /**
   * Get list of pinned files from Pinata
   * @param filters Optional filters for the pin list
   * @returns List of pinned items
   */
  static async getPinList(
    filters: {
      status?: 'pinned' | 'unpinned' | 'all';
      pageLimit?: number;
      pageOffset?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<PinataPinListResponse> {
    try {
      const url = `${this.BASE_URL}/data/pinList`;
      
      // Build query parameters
      const params: Record<string, any> = {
        status: filters.status || 'pinned',
        pageLimit: Math.min(filters.pageLimit || 10, 1000), // Max 1000 per API docs
        pageOffset: filters.pageOffset || 0,
      };

      // Add metadata filters
      if (filters.metadata) {
        Object.entries(filters.metadata).forEach(([key, value]) => {
          params[`metadata[keyvalues][${key}]`] = value;
        });
      }

      const response: AxiosResponse<PinataPinListResponse> = await axios.get(url, {
        params,
        headers: this.getHeaders(),
        timeout: 30000,
      });

      console.log(`✅ Retrieved ${response.data.count} pinned items from Pinata`);
      return response.data;

    } catch (error: any) {
      console.error('❌ Error fetching pin list from Pinata:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Pinata API credentials');
      } else if (error.response?.status === 429) {
        throw new Error('Pinata rate limit exceeded. Please try again later');
      } else {
        throw new Error(`Failed to fetch pin list: ${error.message}`);
      }
    }
  }

  /**
   * Test Pinata connection and authentication
   * @returns Boolean indicating if connection is successful
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
        console.warn('⚠️ Pinata API keys not configured');
        return false;
      }

      const url = `${this.BASE_URL}/data/testAuthentication`;
      
      await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      console.log('✅ Pinata connection successful');
      return true;

    } catch (error: any) {
      console.error('❌ Pinata connection failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Generate IPFS gateway URL for a hash
   * @param ipfsHash The IPFS hash
   * @param gateway Optional custom gateway (defaults to Pinata gateway)
   * @returns Full URL to access the content
   */
  static getIPFSUrl(ipfsHash: string, gateway: string = 'https://gateway.pinata.cloud'): string {
    // Remove ipfs:// prefix if present
    const cleanHash = ipfsHash.replace(/^ipfs:\/\//, '');
    return `${gateway}/ipfs/${cleanHash}`;
  }

  /**
   * Create NFT metadata object
   * @param params Metadata parameters
   * @returns Formatted NFT metadata
   */
  static createNFTMetadata(params: {
    name: string;
    description: string;
    imageHash: string;
    attributes?: Array<{ trait_type: string; value: any }>;
    externalUrl?: string;
  }) {
    return {
      name: params.name,
      description: params.description,
      image: `ipfs://${params.imageHash}`,
      ...(params.externalUrl && { external_url: params.externalUrl }),
      ...(params.attributes && { attributes: params.attributes }),
      // Add GomGom specific metadata
      created_by: 'GomGom Loyalty System',
      created_at: new Date().toISOString(),
    };
  }
}

// Export individual functions for backward compatibility
export const pinFileToIPFS = IpfsService.pinFileToIPFS.bind(IpfsService);
export const pinJSONToIPFS = IpfsService.pinJSONToIPFS.bind(IpfsService);
export const getPinList = IpfsService.getPinList.bind(IpfsService);
export const testConnection = IpfsService.testConnection.bind(IpfsService);
export const getIPFSUrl = IpfsService.getIPFSUrl.bind(IpfsService);
export const createNFTMetadata = IpfsService.createNFTMetadata.bind(IpfsService);