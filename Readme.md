A small utility built with ElectronJS which consolidates information and troubleshooting tools
for computers in a domain environment. 

Requires a .env file in the root with the following entries.

AD_URL= This should be your active directory URL
AD_BASE= This should be your active directory search base for computers
AD_DOMAIN= This should be your active directory domain name. 

**Application uses a FILE DATABASE and shouldn't be used for large domains with many computers
I've tested with ~250 and it works fine. See the documentation for lowDB to learn more**