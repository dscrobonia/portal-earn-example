/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    portalClientApiKey: '1dc06462-dbab-40ee-8470-390d562d2bee', // '01e3f373-a1da-4d75-ad9a-cd8ce9183288', ($5 UDSC) // 'c1ed7840-715d-4511-be7a-9773d5081470', <-- non-AA
    solanaChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    solMint: 'So11111111111111111111111111111111111111112',
    pyUsdMint: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    solanaRpcUrl: 'https://api.devnet.solana.com',
  },
};

export default nextConfig;
