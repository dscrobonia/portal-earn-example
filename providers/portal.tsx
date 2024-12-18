import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import Portal from '@portal-hq/web';

import pyusdThumb from '../public/pyusd.png';
import solanaThumb from '../public/solana.png';
import { RequestArguments } from '@portal-hq/web/types';

export interface ITokenBalance {
  balance: string;
  decimals: number;
  name: string;
  rawBalance: string;
  symbol: string;
  metadata: Record<string, unknown> & {
    tokenMintAddress: string;
  };
}

interface IPortalContext {
  ready: boolean;
  getSolanaAddress: () => Promise<string>;
  getEip155Address: () => Promise<string>;
  getSolanaTokenBalances: () => Promise<ITokenBalance[]>;
  getPolygonTokenBalances: () => Promise<ITokenBalance[]>;
  request: (req: RequestArguments) => Promise<string>;
  sendTokensOnSolana: (
    to: string,
    tokenMint: string,
    tokenAmount: number,
  ) => Promise<string>;
}

const PortalContext = createContext<IPortalContext>({} as IPortalContext);
export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [portal, setPortal] = useState<Portal>();

  useEffect(() => {
    console.log(process.env.portalClientApiKey)

    setPortal(
      new Portal({
        apiKey: process.env.portalClientApiKey,
        autoApprove: true,
        rpcConfig: {
          [process.env.solanaChainId!]: process.env.solanaRpcUrl!,
          "eip155:137": "https://polygon-mainnet.g.alchemy.com/v2/ExD4AhsURGGgGXK7455Pekt-FkCwSKEn"
        },
      }),
    );
  }, []);

  return (
    <PortalContext.Provider
      value={{
        ready: Boolean(portal && portal.ready),
        async getSolanaAddress() {
          if (!portal || !portal?.ready)
            throw new Error('Portal has not initialised');

          const walletExists = await portal.doesWalletExist();

          if (!walletExists) {
            await portal.createWallet();
          }

          const solAddress = await portal.getSolanaAddress();

          return solAddress;
        },
        async getEip155Address() {
          if (!portal || !portal?.ready)
            throw new Error('Portal has not initialised');

          const walletExists = await portal.doesWalletExist();

          if (!walletExists) {
            await portal.createWallet();
          }

          const eip155Address = await portal.getEip155Address();

          return eip155Address;
        },
        async request(req: RequestArguments) {
          if (!portal || !portal?.ready)
            throw new Error('Portal has not initialised');

          return portal.request(req)
        },
        async getPolygonTokenBalances() {
          const res = await fetch('/api/getPolygonAssets');
          const data = await res.json();

          if (data.error) throw new Error(data.error);


          data.tokenBalances.map((val: any) => {
            console.log(val)
          })

          return data.tokenBalances
        },
        async getSolanaTokenBalances() {
          const res = await fetch('/api/getSolanaAssets');
          const data = await res.json();

          if (data.error) throw new Error(data.error);

          const pyusdBalance: ITokenBalance = data.tokenBalances.find(
            (tb: ITokenBalance) =>
              tb.metadata.tokenMintAddress === process.env.pyusdMint,
          ) || {
            balance: '0',
            decimals: 6,
            name: 'PayPal USD',
            rawBalance: '0',
            symbol: 'PYUSD',
            metadata: {
              tokenMintAddress: process.env.pyusdMint,
            },
          };

          return [
            {
              balance: data.nativeBalance.balance,
              decimals: data.nativeBalance.decimals,
              name: data.nativeBalance.name,
              rawBalance: data.nativeBalance.rawBalance,
              symbol: data.nativeBalance.symbol,
              metadata: {
                tokenMintAddress: process.env.solMint,
                thumbnail: solanaThumb.src,
                ...data.nativeBalance.metadata,
              },
            },
            {
              ...pyusdBalance,
              metadata: {
                ...pyusdBalance.metadata,
                thumbnail: pyusdThumb.src,
              },
            },
            ...data.tokenBalances.filter(
              (tb: ITokenBalance) =>
                tb.metadata.tokenMintAddress !== process.env.pyusdMint,
            ),
          ];
        },
        async sendTokensOnSolana(to, tokenMint, tokenAmount) {
          if (!portal || !portal?.ready)
            throw new Error('Portal has not initialised');

          const res = await fetch('/api/buildSolanaTransaction', {
            method: 'POST',
            body: JSON.stringify({
              to,
              token: tokenMint,
              amount: String(tokenAmount),
            }),
          });
          const data = await res.json();

          if (data.error) throw new Error(data.error);

          const txnHash = await portal.request({
            chainId: process.env.solanaChainId,
            method: 'sol_signAndSendTransaction',
            params: data.transaction,
          });

          return txnHash;
        },
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => useContext(PortalContext);
