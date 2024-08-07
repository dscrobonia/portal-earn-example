import { useEffect, useState, ReactNode } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { useRouter } from 'next/router';
import { Button, Container, InputAdornment, TextField } from '@mui/material';
import { usePortal } from '@/providers/portal';
import { ContentCopy, Send } from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const DRAWER_ITEMS = [
  {
    name: 'Dashboard',
    link: '/'
  },
  {
    name: 'Send Tokens',
    link: '/send'
  },
]


const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function Layout({
  children
}: { children: ReactNode }) {
  const theme = useTheme();
  const router = useRouter()

  const portal = usePortal()
  const [solanaAddress, setSolanaAddress] = useState('');

  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    console.log(portal)
  }, [portal, portal?.ready])

  return (
    <Box sx={{ display: 'flex' }}>
      <Container maxWidth="xl">
        <CssBaseline />
        <MuiAppBar position="fixed">
          <Container maxWidth="xl">
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{ mr: 2, ...(open && { display: 'none' }) }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Box>
                {
                  !!solanaAddress ?
                    <TextField
                      size="small"
                      id="outlined-controlled"
                      label="Solana Address"
                      value={solanaAddress}
                      contentEditable={false}
                      spellCheck={false}
                      InputProps={{

                        disableUnderline: true,
                        endAdornment: <InputAdornment position="end">
                          <IconButton
                            // onClick={}
                            edge="end"
                          >
                            <ContentCopy />
                          </IconButton>
                        </InputAdornment>
                      }}
                    />
                    :
                    <Button
                      color='inherit'
                      variant="outlined"
                      disabled={!portal?.ready}
                      onClick={async () => setSolanaAddress(await portal!.getSolanaWallet())}
                      endIcon={<Send />}>
                      Get Solana Wallet
                    </Button>
                }
              </Box>
            </Toolbar>
          </Container>
        </MuiAppBar>
        <Drawer
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {DRAWER_ITEMS.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => router.push(item.link)}>
                  {/* <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                  </ListItemIcon> */}
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Container maxWidth="xl">
          <DrawerHeader />
          {children}
        </Container>
      </Container>
    </Box>
  );
}