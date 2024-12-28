# Aptos NFT Marketplace Bounty

# Set-up Instructions (Codespaces)
## Download and set up Petra wallet
* Install the aptos petra wallet and create an account.

## Replace "yourWalletAddress" with Petra wallet address
* Copy the wallet address from your newly created or existing petra wallet account.
* Go to the settings tab of your wallet and click on "Manage account", put in your password and then copy your private key and keep it safe. We'll use it later on.
* Locate these files in the explorer `NFTMarketplace.move`, `Move.toml` in the contracts/source directory and `.env` file in the frontend_ directory. Locate and replace "yourWalletAddress" with the wallet address of your petra account, the one you copied earlier.

## Set up environment and start server
Open a terminal and run the following commands one after the other:
* `curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3` (to install aptos cli)
* `aptos info` (to verfify that the cli installed successfully)
* `aptos init` (choose "testnet" by typing it, and paste in the private key you copied once prompted. Also locate and click the link that appears if it fails to redirect you automatically to the faucet)
* `aptos move publish` (type yes and click enter after running this command to publish the smart contract) 
* `cd frontend_`
* `curl -fsSL https://fnm.vercel.app/install | bash`

Open a new terminal and continue running the following commands one after the other:
* `source /home/vscode/.bashrc`
* `fnm install --lts`
* `npm i @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-ant-design petra-plugin-wallet-adapter --legacy-peer-deps`
* `npm install react-router-dom --legacy-peer-deps`
* `npm start` (to start the frontend server)

Now you're all set to explore the new features!!!

# New Features
## 1. NFT Transfer Feature
The marketplace now includes a dedicated NFT transfer functionality that allows users to securely transfer their NFTs to other addresses. I added this feature to both the Marketplace (`MarketView.tsx`) page and the my-collections (`MyNFTs.tsx`) page of the frontend of the application, so that users can also transfer their nfts to others without having to list it for sale in the marketplace.

### Function Details
```move
public entry fun transfer_nft(
    account: &signer,
    marketplace_addr: address,
    nft_id: u64,
    new_owner: address
) acquires Marketplace
```
### Parameters
* account: The signer (current owner of the NFT)
* marketplace_addr: The address where the marketplace is deployed
* nft_id: The unique identifier of the NFT to transfer
* new_owner: The address of the recipient

### Security Features
* Ownership verification: Only the current owner can transfer the NFT
* Duplicate transfer prevention: Cannot transfer to the same owner
* Automatic status reset:
* Sets for_sale status to false
* Resets price to 0 after a transfer

### Error Codes
* `500`: Thrown when caller is not the owner
* `501`: Thrown when attempting to transfer to the current owner

  
## 2. Rate NFT Feature
A new rating system that allows users to provide feedback on NFTs through a 1-5 star rating mechanism. This was added to the marketplace (`MarketView.tsx`) page alone, since the marketplace page is where the nfts are sold and bought, it makes sense to integrate the rating feature there, so users can know what others think about a particular nft before they buy it.

### Function Details
```move
public entry fun rate_nft(
    account: &signer,
    marketplace_addr: address,
    nft_id: u64,
    score: u8
) acquires Marketplace
```

### Parameters
* `account`: The signer (user providing the rating)
* `marketplace_addr`: The address where the marketplace is deployed
* `nft_id`: The unique identifier of the NFT to rate
* `score`: Rating value (1-5)

### Rating System Features
* Score validation (1-5 range)
* One rating per user (updates existing rating if user rates again)
* Automatic average rating calculation
* Stores individual ratings with rater's address

### Rating Structure
```move
struct Rating has copy, drop, store {
    rater: address,
    score: u8
}
```

### Error Codes
* `600`: Thrown when rating score is not between 1 and 5

### Rating Calculation
* Maintains a running average of all ratings
* Updates automatically when new ratings are added
* Stored in `average_rating` field of NFT struct

## Summary
These features significantly enhance the functionality of the marketplace, offering users a broader range of tools and options. By improving the app's usability and interactivity, they create a more seamless, engaging, and enjoyable experience for all users.













