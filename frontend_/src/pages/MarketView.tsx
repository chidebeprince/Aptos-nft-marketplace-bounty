import React, { useState, useEffect } from "react";
import { Typography, Radio, message, Card, Row, Col, Pagination, Tag, Button, Modal, Form, Input } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
};

interface MarketViewProps {
  marketplaceAddr: string;
}

const rarityColors: { [key: number]: string } = {
  1: "green",
  2: "blue",
  3: "purple",
  4: "orange",
};

const rarityLabels: { [key: number]: string } = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Super Rare",
};

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const MarketView: React.FC<MarketViewProps> = ({ marketplaceAddr }) => {
  const { signAndSubmitTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isRateModalVisible, setIsRateModalVisible] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [nftRatings, setNftRatings] = useState<Record<number, number>>({});




  useEffect(() => {
    handleFetchNfts(undefined);
  }, []);

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    const setAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
    try {
        const response = await client.getAccountResource(
            marketplaceAddr,
            `${setAddress}::NFTMarketplace::Marketplace`
        );
        // Fetch the Marketplace resource
        const marketplaceResponse = await client.getAccountResource(
          marketplaceAddr,
          `${marketplaceAddr}::NFTMarketplace::Marketplace`
        );

        // Extract NFT data from the response
        const marketplaceData = marketplaceResponse.data as { nfts: any[] };

        // Create a map of NFT IDs to their average ratings
        const nftRatings = marketplaceData.nfts.reduce((acc, nft) => {
          acc[nft.id] = nft.average_rating; // Use the average_rating field
          return acc;
        }, {});

        // Update the state with NFT ratings
        setNftRatings(nftRatings);


        const nftList = (response.data as { nfts: NFT[] }).nfts;

        const hexToUint8Array = (hexString: string): Uint8Array => {
            const bytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
                bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
            }
            return bytes;
        };

        const decodedNfts = nftList.map((nft) => ({
            ...nft,
            name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
            description: new TextDecoder().decode(hexToUint8Array(nft.description.slice(2))),
            uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
            price: nft.price / 100000000,
        }));

        // Filter NFTs based on `for_sale` property and rarity if selected
        const filteredNfts = decodedNfts.filter((nft) => nft.for_sale && (selectedRarity === undefined || nft.rarity === selectedRarity));

        setNfts(filteredNfts);
        setCurrentPage(1);
    } catch (error) {
        console.error("Error fetching NFTs by rarity:", error);
        message.error("Failed to fetch NFTs.");
    }
};

  const handleBuyClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBuyModalVisible(true);
  };

  const handleTransferClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsTransferModalVisible(true);
  };  

  const handleRateClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsRateModalVisible(true);
  };  

  const handleCancelBuy = () => {
    setIsBuyModalVisible(false);
    setSelectedNft(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedNft) return;
  
    try {
      const priceInOctas = selectedNft.price * 100000000;
  
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::purchase_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id.toString(), priceInOctas.toString()],
      };
  
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT purchased successfully!");
      setIsBuyModalVisible(false);
      handleFetchNfts(rarity === 'all' ? undefined : rarity); // Refresh NFT list
      console.log("signAndSubmitTransaction:", signAndSubmitTransaction);
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      message.error("Failed to purchase NFT.");
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedNft || !recipientAddress) return;
  
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::transfer_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id.toString(), recipientAddress],
      };
  
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT transferred successfully!");
      setIsTransferModalVisible(false);
      handleFetchNfts(rarity === 'all' ? undefined : rarity); // Refresh NFT list
    } catch (error) {
      console.error("Error transferring NFT:", error);
      message.error("Failed to transfer NFT.");
    }
  };

  const handleConfirmRate = async () => {
    if (!selectedNft || rating === null) return;
  
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::rate_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id.toString(), rating],
      };
  
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT rated successfully!");
      setIsRateModalVisible(false);
      handleFetchNfts(rarity === 'all' ? undefined : rarity); // Refresh NFT list
    } catch (error) {
      console.error("Error rating NFT:", error);
      message.error("Failed to rate NFT.");
    }
  };
  

  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      style={{  
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Title level={2} style={{ marginBottom: "20px" }}>Marketplace</Title>
  
      {/* Filter Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <Radio.Group
          value={rarity}
          onChange={(e) => {
            const selectedRarity = e.target.value;
            setRarity(selectedRarity);
            handleFetchNfts(selectedRarity === 'all' ? undefined : selectedRarity);
          }}
          buttonStyle="solid"
        >
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value={1}>Common</Radio.Button>
          <Radio.Button value={2}>Uncommon</Radio.Button>
          <Radio.Button value={3}>Rare</Radio.Button>
          <Radio.Button value={4}>Super Rare</Radio.Button>
        </Radio.Group>
      </div>
  
      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          display: "flex",
          justifyContent: "center", // Center row content
          flexWrap: "wrap",
        }}
      >
        {paginatedNfts.map((nft) => (
          <Col
            key={nft.id}
            xs={24} sm={12} md={8} lg={6} xl={6}
            style={{
              display: "flex",
              justifyContent: "center", // Center the single card horizontally
              alignItems: "center", // Center content in both directions
            }}
          >
            <Card
              hoverable
              style={{
                width: "100%", // Make the card responsive
                maxWidth: "240px", // Limit the card width on larger screens
                margin: "0 auto",
              }}
              cover={<img alt={nft.name} src={nft.uri} />}
              actions={[
                <Button type="link" onClick={() => handleBuyClick(nft)}>Buy</Button>,
                <Button type="link" onClick={() => handleTransferClick(nft)}>Transfer</Button>,
                <Button type="link" onClick={() => handleRateClick(nft)}>Rate</Button>,
              ]}
            >
              {/* Rarity Tag */}
              <Tag
                color={rarityColors[nft.rarity]}
                style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}
              >
                {rarityLabels[nft.rarity]}
              </Tag>
  
              <Meta title={nft.name} description={`Price: ${nft.price} APT`} />
              <p>{nft.description}</p>
              <p>ID: {nft.id}</p>
              <p>Owner: {truncateAddress(nft.owner)}</p>

              {/* Display average rating as stars */}
              <div style={{ marginTop: "10px" }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      color: index < (nftRatings[nft.id] || 0) ? "#fadb14" : "#d9d9d9",
                      fontSize: "18px",
                    }}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: "8px", fontSize: "14px" }}>
                  {nftRatings[nft.id] ? `(${nftRatings[nft.id]}/5)` : "No ratings"}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
  
      {/* Pagination */}
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={nfts.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
  
      {/* Buy Modal */}
      <Modal
        title="Purchase NFT"
        visible={isBuyModalVisible}
        onCancel={handleCancelBuy}
        footer={[
          <Button key="cancel" onClick={handleCancelBuy}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
            Confirm Purchase
          </Button>,
        ]}
      >
        {selectedNft && (
          <>
            <p><strong>NFT ID:</strong> {selectedNft.id}</p>
            <p><strong>Name:</strong> {selectedNft.name}</p>
            <p><strong>Description:</strong> {selectedNft.description}</p>
            <p><strong>Rarity:</strong> {rarityLabels[selectedNft.rarity]}</p>
            <p><strong>Price:</strong> {selectedNft.price} APT</p>
            <p><strong>Owner:</strong> {truncateAddress(selectedNft.owner)}</p>
          </>
        )}
      </Modal>

      {/* Transfer Modal */}
<Modal
  title="Transfer NFT"
  visible={isTransferModalVisible}
  onCancel={() => setIsTransferModalVisible(false)}
  footer={[
    <Button key="cancel" onClick={() => setIsTransferModalVisible(false)}>
      Cancel
    </Button>,
    <Button key="confirm" type="primary" onClick={handleConfirmTransfer}>
      Confirm Transfer
    </Button>,
  ]}
>
  {selectedNft && (
    <>
      <p><strong>NFT ID:</strong> {selectedNft.id}</p>
      <p><strong>Name:</strong> {selectedNft.name}</p>
      <Form layout="vertical">
        <Form.Item label="Recipient Address">
          <Input
            placeholder="Enter recipient wallet address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </Form.Item>
      </Form>
    </>
  )}
</Modal>

    {/* Rate modal */}
<Modal
  title="Rate NFT"
  visible={isRateModalVisible}
  onCancel={() => setIsRateModalVisible(false)}
  footer={[
    <Button key="cancel" onClick={() => setIsRateModalVisible(false)}>
      Cancel
    </Button>,
    <Button key="confirm" type="primary" onClick={handleConfirmRate}>
      Confirm Rating
    </Button>,
  ]}
>
  {selectedNft && (
    <>
      <p><strong>NFT ID:</strong> {selectedNft.id}</p>
      <p><strong>Name:</strong> {selectedNft.name}</p>
      <Form layout="vertical">
        <Form.Item label="Rating (1-5)">
          <Input
            type="number"
            placeholder="Enter a rating"
            value={rating ?? ""}
            onChange={(e) => setRating(Number(e.target.value))}
            min={1}
            max={5}
          />
        </Form.Item>
      </Form>
    </>
  )}
</Modal>
    </div>
  );
};

export default MarketView;
