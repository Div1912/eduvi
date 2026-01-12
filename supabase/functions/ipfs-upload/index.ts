import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PINATA_API_URL = 'https://api.pinata.cloud';

interface CredentialMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  studentName: string;
  degree: string;
  university: string;
  issuedAt: string;
  issuerAddress: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PINATA_API_KEY = Deno.env.get('PINATA_API_KEY');
    const PINATA_SECRET_KEY = Deno.env.get('PINATA_SECRET_KEY');

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.error('Pinata API keys not configured');
      return new Response(
        JSON.stringify({ error: 'IPFS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    
    // Handle file upload
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing file upload...');
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create form data for Pinata
      const pinataFormData = new FormData();
      pinataFormData.append('file', file);
      
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: 'credential-document',
          uploadedAt: new Date().toISOString(),
        },
      });
      pinataFormData.append('pinataMetadata', metadata);
      
      const options = JSON.stringify({ cidVersion: 1 });
      pinataFormData.append('pinataOptions', options);

      console.log('Uploading file to Pinata...');
      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: pinataFormData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Pinata file upload error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to upload file to IPFS' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('File uploaded successfully:', data.IpfsHash);
      
      return new Response(
        JSON.stringify({ 
          ipfsHash: `ipfs://${data.IpfsHash}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle JSON metadata upload
    if (contentType.includes('application/json')) {
      console.log('Processing metadata upload...');
      const body = await req.json();
      const { metadata } = body as { metadata: CredentialMetadata };

      if (!metadata) {
        return new Response(
          JSON.stringify({ error: 'No metadata provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Uploading metadata to Pinata...');
      const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `credential-${metadata.studentName}-${Date.now()}`,
            keyvalues: {
              type: 'credential-metadata',
              student: metadata.studentName,
              university: metadata.university,
            },
          },
          pinataOptions: { cidVersion: 1 },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Pinata metadata upload error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to upload metadata to IPFS' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Metadata uploaded successfully:', data.IpfsHash);
      
      return new Response(
        JSON.stringify({ 
          ipfsHash: `ipfs://${data.IpfsHash}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid content type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('IPFS upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
