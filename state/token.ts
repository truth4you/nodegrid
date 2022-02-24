import { eth } from "state/eth" // ETH state provider
import { ethers } from "ethers" // Ethers
import { formatFixed } from "@ethersproject/bignumber"
import { useEffect, useState } from "react" // React
import { createContainer } from "unstated-next" // State management
import { BigNumber } from "ethers"

const TokenABI = require("abi/Token.json")
const ERC20ABI = require("abi/ERC20.json")
const UINT256_MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

function useToken() {
  const defaultProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  
  return {
  }
}

export const token = createContainer(useToken)
