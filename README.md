# NFT Marketplace Smart Contract - New Features Documentation
## 1. Transfer NFTs Feature
The contract now includes a dedicated NFT transfer functionality that allows users to securely transfer their NFTs to other addresses.

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
* Resets price to 0

### Error Codes
* `500`: Thrown when caller is not the owner
* `501`: Thrown when attempting to transfer to the current owner

  
## 2. Rate NFTs Feature
A new rating system that allows users to provide feedback on NFTs through a 1-5 star rating mechanism.

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
* Stored in average_rating field of NFT struct













