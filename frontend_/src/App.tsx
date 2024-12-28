// src/App.tsx

import React, { useState } from "react";
import "./App.css";
import { Layout, Modal, Form, Input, Select, Button, Rate, message } from "antd";
import NavBar from "./components/NavBar";
import MarketView from "./pages/MarketView";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MyNFTs from "./pages/MyNFTs";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect } from "react";


const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");
const setAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
const marketplaceAddr = `${setAddress}`;

function App() {
  const { signAndSubmitTransaction } = useWallet();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRateModalVisible, setIsRateModalVisible] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);

  // Function to initialize the marketplace
  const initializeMarketplace = async () => {
    try {
      // Check if the marketplace is already initialized
      const accountResource = await client.getAccountResource(
        marketplaceAddr,
        `${marketplaceAddr}::NFTMarketplace::Marketplace`
      );

      if (accountResource) {
        console.log("Marketplace is already initialized.");
        return; // Marketplace is already initialized, no need to initialize again
      }
    } catch (error: any) {
      if (error.status === 404) {
        console.log("Marketplace is not initialized. Initializing now...");
      } else {
        console.error("Error checking marketplace resource:", error);
        message.error("Failed to check marketplace status.");
        return;
      }
    }

    // Initialize the marketplace if not already initialized
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::initialize`,
        type_arguments: [],
        arguments: [],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("Marketplace initialized successfully!");
    } catch (error) {
      console.error("Error initializing marketplace:", error);
      message.error("Failed to initialize the marketplace.");
    }
  };

  // Call initializeMarketplace when the app starts
  useEffect(() => {
    initializeMarketplace();
  }, [signAndSubmitTransaction]);  

  // Function to open the Mint NFT modal
  const handleMintNFTClick = () => setIsModalVisible(true);

  // Function to open the Rate NFT modal
  const handleRateNFTClick = (nftId: string) => {
    setSelectedNFT(nftId);
    setIsRateModalVisible(true);
  };

  const handleMintNFT = async (values: { name: string; description: string; uri: string; rarity: number }) => {
    try {
      const nameVector = Array.from(new TextEncoder().encode(values.name));
      const descriptionVector = Array.from(new TextEncoder().encode(values.description));
      const uriVector = Array.from(new TextEncoder().encode(values.uri));

      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::mint_nft`,
        type_arguments: [],
        arguments: [nameVector, descriptionVector, uriVector, values.rarity],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("NFT minted successfully!");
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error minting NFT:", error);
      message.error("Failed to mint NFT.");
    }
  };

  const handleRateNFT = async (values: { rating: number }) => {
    if (!selectedNFT) return;

    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::rate_nft`,
        type_arguments: [],
        arguments: [selectedNFT, values.rating],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("NFT rated successfully!");
      setIsRateModalVisible(false);
      setSelectedNFT(null);
    } catch (error) {
      console.error("Error rating NFT:", error);
      message.error("Failed to rate NFT.");
    }
  };

  return (
    <Router>
      <Layout>
        <NavBar onMintNFTClick={handleMintNFTClick} /> {/* Pass handleMintNFTClick to NavBar */}

        <Routes>
          <Route path="/" element={<MarketView marketplaceAddr={marketplaceAddr} />} />
          <Route path="/my-nfts" element={<MyNFTs />} />
        </Routes>

        <Modal
          title="Mint New NFT"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form layout="vertical" onFinish={handleMintNFT}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please enter a name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true, message: "Please enter a description!" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="URI" name="uri" rules={[{ required: true, message: "Please enter a URI!" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Rarity" name="rarity" rules={[{ required: true, message: "Please select a rarity!" }]}>
              <Select>
                <Select.Option value={1}>Common</Select.Option>
                <Select.Option value={2}>Uncommon</Select.Option>
                <Select.Option value={3}>Rare</Select.Option>
                <Select.Option value={4}>Epic</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Mint NFT
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Rate NFT Modal */}
        <Modal
          title="Rate NFT"
          visible={isRateModalVisible}
          onCancel={() => setIsRateModalVisible(false)}
          footer={null}
        >
          <Form layout="vertical" onFinish={handleRateNFT}>
            <Form.Item
              label="Rating"
              name="rating"
              rules={[{ required: true, message: "Please provide a rating!" }]}
            >
              <Rate />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit Rating
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Router>
  );
}

export default App;