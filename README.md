# OPN Etherlink Bridge

[![Github Actions][gha-badge]][gha] [![License: MIT][license-badge]][license]

[gha]: https://github.com/GETProtocol/opn-etherlink-bridge/actions
[gha-badge]: https://github.com/GETProtocol/opn-etherlink-bridge/actions/workflows/lint.yml/badge.svg
[license]: https://opensource.org/licenses/MIT
[license-badge]: https://img.shields.io/badge/License-MIT-blue.svg

A bridge implementation for the OPEN Ticketing Ecosystem using LayerZero's Omni Fungible Token (OFT) standard to enable
cross-chain token transfers between Ethereum (and testnets) and the Etherlink blockchain.

## Features

- Cross-chain token bridging using LayerZero v2 protocol
- Support for both mainnet and testnet environments
- Automated deployment and configuration scripts
- Comprehensive testing and verification tools
- TypeScript/Hardhat development environment
- Linting and code formatting enforcement
- GitHub Actions CI/CD pipeline

## Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (Package manager and runtime)
- [Node.js](https://nodejs.org/) v18 or later
- [Git](https://git-scm.com/)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/GETProtocol/opn-etherlink-bridge.git
   cd opn-etherlink-bridge
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your:
   - `MNEMONIC`: Your wallet's mnemonic phrase
   - `INFURA_API_KEY`: API key for Infura
   - `ETHERSCAN_API_KEY`: API key for Etherscan verification

## Bridge Setup

The bridge consists of three main components:

1. ERC20 Token (source chain)
2. OFTAdapter (source chain)
3. OFT Token (destination chain)

### Quick Setup

Use the automated setup script to deploy and configure all components:

```bash
# On source chain (e.g., Sepolia)
npx hardhat setup-bridge \
  --token-name "TestOPN" \
  --token-symbol "TSTOPN" \
  --token-supply "2200000" \
  --oft-name "TestOFT" \
  --oft-symbol "TOFT" \
  --test-amount "100" \
  --receiver "YOUR_ADDRESS" \
  --network sepolia
```

### Manual Setup

If you prefer to set up components individually:

1. Deploy Token (source chain):

   ```bash
   npx hardhat deploy-token \
     --name "TestOPN" \
     --symbol "TSTOPN" \
     --supply "2200000" \
     --network sepolia
   ```

2. Deploy OFTAdapter (source chain):

   ```bash
   npx hardhat deploy-oft-adapter \
     --token "TOKEN_ADDRESS" \
     --network sepolia
   ```

3. Deploy OFT (destination chain):

   ```bash
   npx hardhat deploy-oft \
     --name "TestOFT" \
     --symbol "TOFT" \
     --network etherlink-testnet
   ```

4. Set up peers:

   ```bash
   # On source chain
   npx hardhat set-oftadapter-peer --network sepolia

   # On destination chain
   npx hardhat set-oft-peer --network etherlink-testnet
   ```

5. Configure options and settings:

   ```bash
   # On source chain
   npx hardhat set-enforced-options --is-for-oft-adapter true --network sepolia
   npx hardhat set-config --is-for-oft-adapter true --network sepolia

   # On destination chain
   npx hardhat set-enforced-options --network etherlink-testnet
   npx hardhat set-config --network etherlink-testnet
   ```

## Usage

### Sending Tokens Cross-Chain

1. From source to destination chain:

   ```bash
   npx hardhat send-oft \
     --amount "100" \
     --receiver "RECEIVER_ADDRESS" \
     --network sepolia
   ```

2. From destination back to source chain:
   ```bash
   npx hardhat send-oft-back \
     --amount "100" \
     --receiver "RECEIVER_ADDRESS" \
     --network etherlink-testnet
   ```

### Additional Options

- `--gas-drop`: Amount of native gas to drop on destination chain (in wei)
- `--max-gas`: Maximum gas for executor LayerZero receive option

## Development

### Available Scripts

- `bun run compile`: Compile contracts
- `bun run test`: Run tests
- `bun run lint`: Run all linters
- `bun run lint:fix`: Fix linting issues
- `bun run format`: Format code
- `bun run typecheck`: Check TypeScript types
- `bun run coverage`: Generate test coverage report
- `bun run clean`: Clean build artifacts

### Code Quality

The repository uses:

- ESLint for TypeScript linting
- Prettier for code formatting
- Solhint for Solidity linting
- Husky for git hooks
- lint-staged for pre-commit checks

### Networks

Supported networks:

- Ethereum Mainnet
- Sepolia Testnet
- Etherlink Mainnet
- Etherlink Testnet

Configure additional networks in `hardhat.config.ts`.

## Error Handling

Common LayerZero error codes:

- `0xf6ff4fb7`: Peer not set
- `0x91ac5e4f`: Invalid endpoint call
- `0x0fbdec0a`: Invalid endpoint caller
- `0x9f704120`: Insufficient native gas
- `0x5373352a`: LayerZero token unavailable
- `0x71c4efed`: Slippage exceeded
- `0x1e9714b0`: Invalid local decimals
- `0x9a6d49cd`: Invalid options
- `0xb5863604`: Invalid delegate
- `0xc26bebcc`: Only peer can call this function

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
