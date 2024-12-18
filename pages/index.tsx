import { ITokenBalance, usePortal } from '@/providers/portal';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Input,
  InputAdornment,
  Link,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import { Refresh, Token } from '@mui/icons-material';
import { useSnackbar } from '@/providers/snackbar';

import { ethers } from 'ethers';
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
  Pool,
  PoolBundle,
  transactionType,
} from '@aave/contract-helpers';
import * as markets from '@bgd-labs/aave-address-book';
import { BigNumber, providers } from 'ethers';
import { EthereumTransactionTypeExtended } from '@aave/contract-helpers';
import { formatReserves, formatUserSummaryAndIncentives } from '@aave/math-utils';
import dayjs from 'dayjs';


export default function Home() {
  const portal = usePortal();
  const snackbar = useSnackbar();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [usdAvailable, setUsdAvailable] = useState<string>("0.00");
  const [initialInvestment, setInitialInvestment] = useState<string>("0.00");
  const [totalValue, setTotalValue] = useState<string>("0.00");
  const [interestRate, setInterestRate] = useState<string>("0.00")
  const [tokens, setTokens] = useState<ITokenBalance[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  const loadTokens = async () => {
    try {
      setTokensLoading(true);
      const tokens = await portal.getPolygonTokenBalances();
      if (tokens) setTokens(tokens);
    } catch (e) {
      snackbar.setSnackbarOpen(true);
      snackbar.setSnackbarContent({
        severity: 'error',
        message: `Something went wrong - ${e}`,
      });
    } finally {
      setTokensLoading(false);
    }
  };

  const allow = async() => {
    // USDC Contract Details
    // const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon aUSDC
    const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
    const USDC_ABI = [
      "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    // Initialize the contract interface
    const iface = new ethers.utils.Interface(USDC_ABI);

    // Transaction details
    const spenderAddress = markets.AaveV3Polygon.POOL // await portal.getEip155Address(); // Replace with the spender's address
    const amount = ethers.utils.parseUnits("1000", 6); // 1000 USDC (6 decimals)

    // Generate transaction data
    const data = iface.encodeFunctionData("approve", [spenderAddress, amount]);

    // Construct the transaction parameters
    const params = {
      to: USDC_ADDRESS,
      data: data,
      value: "0x0" // No ETH/MATIC is sent for an approve transaction
    };

    console.log("Transaction Parameters:", params);

    const res = await portal.request({
      chainId: "eip155:137",
      method: "eth_sendTransaction",
      params
    })
    console.log(res)
  }

  const getInfo = async () => {
    console.log(`get info - portal ready: ${portal.ready}`)
    if (!portal) return

    console.log(`Portal Addresses: ${await portal.getEip155Address()}`)

    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ExD4AhsURGGgGXK7455Pekt-FkCwSKEn');

    // User address to fetch data for, insert address here
    //const currentAccount = '0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c';
    const currentAccount = await portal.getEip155Address()

    // View contract used to fetch all reserves data (including market base currency data), and user reserves
    // Using Aave V3 Eth Mainnet address for demo
    const poolDataProviderContract = new UiPoolDataProvider({
      uiPoolDataProviderAddress: markets.AaveV3Polygon.UI_POOL_DATA_PROVIDER,
      provider,
      chainId: ChainId.polygon,
    });

    // View contract used to fetch all reserve incentives (APRs), and user incentives
    // Using Aave V3 Eth Mainnet address for demo
    const incentiveDataProviderContract = new UiIncentiveDataProvider({
      uiIncentiveDataProviderAddress:
        markets.AaveV3Polygon.UI_INCENTIVE_DATA_PROVIDER,
      provider,
      chainId: ChainId.polygon,
    });

    // Object containing array of pool reserves and market base currency data
    // { reservesArray, baseCurrencyData }
    const reserves = await poolDataProviderContract.getReservesHumanized({
      lendingPoolAddressProvider: markets.AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    });

    // Object containing array or users aave positions and active eMode category
    // { userReserves, userEmodeCategoryId }
    const userReserves = await poolDataProviderContract.getUserReservesHumanized({
      lendingPoolAddressProvider: markets.AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
      user: currentAccount,
    });

    // Array of incentive tokens with price feed and emission APR
    const reserveIncentives =
      await incentiveDataProviderContract.getReservesIncentivesDataHumanized({
        lendingPoolAddressProvider:
          markets.AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
      });

    // Dictionary of claimable user incentives
    const userIncentives =
      await incentiveDataProviderContract.getUserReservesIncentivesDataHumanized({
        lendingPoolAddressProvider:
          markets.AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
        user: currentAccount,
      });

  console.log('get reserve info')
  console.log({ reserves, userReserves, reserveIncentives, userIncentives });

  // 'reserves', 'userReserves', 'reserveIncentives', and 'userIncentives' inputs from Setup section

  const reservesArray = reserves.reservesData;
  const baseCurrencyData = reserves.baseCurrencyData;
  const userReservesArray = userReserves.userReserves;

  const currentTimestamp = dayjs().unix();

  const formattedPoolReserves = formatReserves({
    reserves: reservesArray,
    currentTimestamp,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
  });

    /*
    - @param `currentTimestamp` Current UNIX timestamp in seconds, Math.floor(Date.now() / 1000)
    - @param `marketReferencePriceInUsd` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferencePriceInUsd`
    - @param `marketReferenceCurrencyDecimals` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferenceCurrencyDecimals`
    - @param `userReserves` Input from [Fetching Protocol Data](#fetching-protocol-data), combination of `userReserves.userReserves` and `reserves.reservesArray`
    - @param `userEmodeCategoryId` Input from [Fetching Protocol Data](#fetching-protocol-data), `userReserves.userEmodeCategoryId`
    - @param `reserveIncentives` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserveIncentives`
    - @param `userIncentives` Input from [Fetching Protocol Data](#fetching-protocol-data), `userIncentives`
    */
    const userSummary = formatUserSummaryAndIncentives({
      currentTimestamp,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      marketReferenceCurrencyDecimals:
        baseCurrencyData.marketReferenceCurrencyDecimals,
      userReserves: userReservesArray,
      formattedReserves: formattedPoolReserves,
      userEmodeCategoryId: userReserves.userEmodeCategoryId,
      reserveIncentives,
      userIncentives,
    });

    console.log('get user summary')
    console.log(userSummary)

    // && data.reserve.aTokenAddress == "0xA4D94019934D8333Ef880ABFFbF2FDd611C762BD"
    const polygonUsdcData = userSummary.userReservesData.find(data => {
      if (data.underlyingAsset == "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359") return data
    })

    const rawRate = polygonUsdcData?.reserve.liquidityRate
    if (!rawRate) return

    const supplyRate = parseFloat(rawRate) / 1e27; // Convert ray to decimal
    console.log(`Supply Rate: ${(supplyRate * 100).toFixed(2)}%`);

    const formattedSupplyRate = (supplyRate * 100).toFixed(3)
    setInterestRate(formattedSupplyRate)
    console.log('HERE')
    console.log(polygonUsdcData)
    console.log(polygonUsdcData.underlyingBalance)
    setTotalValue(polygonUsdcData.underlyingBalance)
    setInitialInvestment((Number(userSummary.totalCollateralUSD)).toFixed(2))

  }

const earn = async () => {
  // Initialize provider and wallet
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/ExD4AhsURGGgGXK7455Pekt-FkCwSKEn');
  const currentAccount = await portal.getEip155Address()

  const pool = new Pool(provider, {
    POOL: markets.AaveV3Polygon.POOL,
  });


    // USDC Contract Address on Polygon
    const usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    const erc20Abi = [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function balanceOf(address account) public view returns (uint256)",
      "function allowance(address owner, address spender) public view returns (uint256)",
      "function transfer(address recipient, uint256 amount) public returns (bool)",
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    // Create a contract instance
    const usdcContract = new ethers.Contract(usdcAddress, erc20Abi, provider);
    const balance = await usdcContract.balanceOf(currentAccount);
    console.log(`USDC Balance: ${ethers.utils.formatUnits(balance, 6)} USDC`);

    console.log('getting supply...')
    if (!amount || amount <= 0) throw new Error("invalid amount")

    const data: EthereumTransactionTypeExtended[] = await pool.supply({
      user: currentAccount,
      reserve: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC Polygon Reserve address
      amount: `${amount}`,
    })

    console.log(data)
  
    let tx: transactionType

    try{
      tx = await data[0].tx()
      console.log(tx)
    
      const { from, ...txData } = tx
    
      console.log('txData')
      console.log(txData)

      console.log('sending request...')
      const res = await portal.request({ chainId: "eip155:137", method: "eth_sendTransaction", params: {
        data: tx.data,
        to: tx.to,
        from: tx.from,
        gasLimit: tx.gasLimit?.toHexString(),
        value: tx.value
      } })

      console.log(res)
    } catch (e) {
      console.log("something failed")
      console.log(e)
      tx = {}
    }
    
}

  useEffect(() => {
    loadTokens();
    getInfo();
  }, [portal.ready]);

  return (
    <Box>
      <Container maxWidth="lg">

      <Box p={4}>
          <Grid container>
            <Grid item xs={8}>
              <Typography textAlign="left" variant="h6" component={'h1'}>
                Earn Details
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="right">
              <Button
                color="inherit"
                onClick={() => {
                  loadTokens();
                }}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
          <Box>
            <Grid container spacing={2} justifyContent="space-between">
              {/* Interest Rate */}
              <Grid item xs={4}>
                <Typography variant="subtitle1" textAlign="center">
                  Interest Rate
                </Typography>
                <Typography variant="h6" textAlign="center">
                  {interestRate}%
                </Typography>
              </Grid>

              {/* Cash */}
              {/* <Grid item xs={4}>
                <Typography variant="subtitle1" textAlign="center">
                  Cash Available
                </Typography>
                <Typography variant="h6" textAlign="center">
                  ${usdAvailable}
                </Typography>
              </Grid> */}

               {/* Initial Investment */}
               <Grid item xs={4}>
                <Typography variant="subtitle1" textAlign="center">
                  Invested
                </Typography>
                <Typography variant="h6" textAlign="center">
                  ${initialInvestment}
                </Typography>
              </Grid>

              {/* Total Value Now */}
              <Grid item xs={4}>
                <Typography variant="subtitle1" textAlign="center">
                  Total Value
                </Typography>
                <Typography variant="h6" textAlign="center">
                  ${totalValue}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Box
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* <Typography fontSize={{ xs: 12, md: 16 }}>
            Need SOL or PYUSD? Get them from their respective faucets -{' '}
            <Link href="https://faucet.solana.com/">Solana Faucet</Link> and{' '}
            <Link href="https://faucet.paxos.com/">Paxos Faucet</Link>
          </Typography> */}
          <Input
            onInput={(e) => {
              const amount = Number(e.target.value);
              if (amount < 0) return;
              setAmount(amount);
            }}
            type="number"
            value={amount.toFixed(2)}
            sx={{
              padding: '8px 12px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              '&:focus': {
                outline: 'none',
                borderColor: '#1976d2',
              },
            }}
            startAdornment={
              <InputAdornment position="start">
                $
              </InputAdornment>
            }
          />
          <Button color="primary" onClick={earn} sx={{
            m: 1,
            border: '2px solid #1976d2', // Add a border
            backgroundColor: '#1976d2',  // Set background color
            color: 'white',              // Set text color
            '&:hover': {
              backgroundColor: '#115293', // Change background color on hover
            },
          }}>Earn</Button>
        </Box>

        

        <Box>
          <Grid container>
            <Grid item xs={8}>
              <Typography textAlign="left" variant="h6" component={'h1'}>
                Tokens Held
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="right">
              <Button
                color="inherit"
                onClick={() => {
                  loadTokens();
                }}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
          <Box>
            <List sx={{ bgcolor: 'background.paper', p: { md: 4 } }}>
              {tokens.length && !tokensLoading
                ? tokens
                    .map((token, idx) => {
                      return (
                        <ListItem key={idx}>
                          <ListItemAvatar>
                            <Avatar
                              alt={token.symbol}
                              src={token.metadata?.thumbnail as string}
                            >
                              {!token.metadata?.thumbnail ? <Token /> : <></>}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography fontSize={{ xs: 14, md: 16 }}>
                                {token.name}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                display={{ xs: 'none', md: 'block' }}
                                fontSize={12}
                              >
                                {token.metadata.tokenMintAddress}
                              </Typography>
                            }
                          />
                          <ListItemText
                            sx={{
                              textAlign: 'right',
                            }}
                            primary={
                              <Typography
                                fontSize={{ xs: 14, md: 20 }}
                                fontWeight={600}
                                color="primary"
                              >
                                <Typography
                                  component="span"
                                  fontSize={{ xs: 12, md: 16 }}
                                >
                                  {token.symbol}{' '}
                                </Typography>
                                {`${Number(token.balance).toFixed(6)}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })
                    .flatMap((item, idx) => {
                      if (idx === tokens.length - 1) {
                        return [item];
                      }
                      return [
                        item,
                        <Divider key={idx} variant="inset" component="li" />,
                      ];
                    })
                : tokensLoading && (
                    <ListItem sx={{ justifyContent: 'center' }}>
                      <CircularProgress />
                    </ListItem>
                  )}
            </List>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
