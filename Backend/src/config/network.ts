import dns from 'node:dns';
import net from 'node:net';

// Windows/ISP IPv6 routing makes Node fetch hang on some APIs. Force IPv4 in code (no NODE_OPTIONS needed).
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(false);