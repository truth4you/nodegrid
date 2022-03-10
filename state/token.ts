import { eth } from "state/eth" // ETH state provider
import { ethers } from "ethers" // Ethers
import { Contract, Provider, setMulticallAddress } from "ethers-multicall"
import { useEffect, useState } from "react" // React
import { createContainer } from "unstated-next" // State management
import { BigNumber } from "@ethersproject/bignumber"

const TokenABI = require("abi/NodeManager.json")
const ERC20ABI = require("abi/ERC20.json")
const NftABI = require("abi/BoostNFT.json")
// const MulticallABI = require("abi/Multicall.json")
const UINT256_MAX = '1000000000000000000000000000000000000000000000000000000000000000'
const MULTICALL_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'

let contractNodeGrid: ethers.Contract
let contractToken: ethers.Contract
let contractNFT: ethers.Contract
let tokenAddress: string
let nftAddress: string

function useToken() {
  const {address,provider} = eth.useContainer()
  const defaultProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  const [tiers, setTiers] = useState<any[]>([])
  const [info, setInfo] = useState<any>({})
  
  const getContract = () => {
    contractNodeGrid = new ethers.Contract(
      String(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
      TokenABI,
      address?provider?.getSigner():defaultProvider
    )
  }

  const getToken = async () => {
    if(!contractNodeGrid)
      getContract()
    if(!tokenAddress)
      tokenAddress = await contractNodeGrid.tokenAddress()
    contractToken = new ethers.Contract(
      tokenAddress,
      ERC20ABI,
      address?provider?.getSigner():defaultProvider
    )
  }

  const getNFT = async () => {
    if(!contractNodeGrid)
      getContract()
    if(!nftAddress)
      nftAddress = await contractNodeGrid.nftAddress()
    contractNFT = new ethers.Contract(
      nftAddress,
      NftABI,
      address?provider?.getSigner():defaultProvider
    )
  }

  const getMultiplier = async (timeTo:Date) : Promise<BigNumber>=>{
    await getNFT()
    return await contractNFT.getLastMultiplier(address, Math.floor(timeTo.getTime()/1000))
  }

  const getTiers = async () : Promise<any[]>=>{
    getContract()
    return await contractNodeGrid.tiers()
  }

  const getNodes = async (account:string) : Promise<any[]>=>{
    getContract()
    console.log(await contractNodeGrid.nodes(account))
    return await contractNodeGrid.nodes(account)
  }

  const getWhitelist = async () : Promise<string[]>=>{
    getContract()
    return await contractNodeGrid.getWhitelist()
  }

  const getUnpaidNodes = async () : Promise<any[]>=>{
    getContract()
    return await contractNodeGrid.unpaidNodes()
  }

  const createNode = async (tier:string, count:number) : Promise<any[]>=>{
    getContract()
    return await(await contractNodeGrid.create(tier, '', count)).wait()
  }

  const compoundNode = async (tier:string, count:number) : Promise<any[]>=>{
    getContract()
    return await(await contractNodeGrid.compound(tier, '', count)).wait()
  }

  const transferNode = async (tier:string, count:number, account:string)=>{
    getContract()
    await(await contractNodeGrid.transfer(tier, count, account)).wait()
  }

  const upgradeNode = async (tierFrom:string, tierTo:string, count:number)=>{
    getContract()
    await(await contractNodeGrid.upgrade(tierFrom, tierTo, count)).wait()
  }

  const burnNode = async (nodes:number[])=>{
    getContract()
    await(await contractNodeGrid.burnNodes(nodes)).wait()
  }

  const claim = async ()=>{
    getContract()
    await(await contractNodeGrid.claim()).wait()
  }

  const pay = async (months:number,nodes:number[],fee:BigNumber)=>{
    getContract()
    await(await contractNodeGrid.pay(months,nodes,{value:fee.toString()})).wait()
  }

  const mintNode = async (accounts:string[],tierName:string,count:number)=>{
    getContract()
    await(await contractNodeGrid.mint(accounts,tierName,'',count)).wait()
  }

  const allowance = async () : Promise<boolean>=>{
    if(address) {
      await getToken()
      const allowance = await contractToken.allowance(address, contractNodeGrid.address)
      if(allowance==undefined) return false
      return allowance.gt(0)
    }
    return false
  }

  const approve = async () => {
    await getToken()
    const tx = await contractToken.approve(contractNodeGrid.address, UINT256_MAX)
    await tx.wait()
  }

  const multicall = async () => {
    await getToken()
    await setMulticallAddress(31337,MULTICALL_ADDRESS)
    const multicall = new Provider(provider??defaultProvider)
    await multicall.init()
    const NodeGrid = new Contract(
      String(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
      TokenABI
    )
    const Token = new Contract(
      tokenAddress,
      ERC20ABI
    )
    const _tiers = await getTiers()
    setTiers(_tiers)
    const calls = []
    calls.push(NodeGrid.tiers())
    calls.push(NodeGrid.countTotal())
    calls.push(NodeGrid.rewardsTotal())
    calls.push(NodeGrid.discountPer10())
    calls.push(NodeGrid.transferFee())
    calls.push(NodeGrid.rewardsPoolFee())
    calls.push(NodeGrid.operatorFee())
    calls.push(NodeGrid.maxCountOfUser())
    if(address) {
      calls.push(multicall.getEthBalance(address))
      calls.push(Token.balanceOf(address))
      calls.push(NodeGrid.countOfUser(address))
      calls.push(NodeGrid.claimable())
      calls.push(NodeGrid.owner())
    }
    _tiers.map(tier=>{
      calls.push(NodeGrid.countOfTier(tier.name))
    })
    const ret = await multicall.all(calls)
    let index = 0
    setTiers(ret[index++])
    info.countTotal = ret[index++]
    info.rewardsTotal = ret[index++]
    info.discountPer10 = ret[index++]
    info.transferFee = ret[index++]
    info.rewardsPoolFee = ret[index++]
    info.operatorFee = ret[index++]
    info.maxCountOfUser = ret[index++]
    if(address) {
      info.balanceETH = ret[index++]
      info.balanceToken = ret[index++]
      info.countOfUser = ret[index++]
      info.claimable = ret[index++]
      info.isOwner = ret[index++].toLowerCase()==address.toLowerCase()
    }
    _tiers.map((tier)=>{
      info[`countOfTier${tier.name}`] = ret[index++]
    })
    setInfo({...info})
  }

  useEffect(()=>{
    if(!tokenAddress) {
      getContract()
      getToken()
    }
    const interval = setInterval(()=>multicall(), 3000)
    return ()=>clearInterval(interval)
  })
  
  return {
    info, 
    tiers, 
    getTiers, 
    allowance, 
    approve, 
    getNodes, 
    getUnpaidNodes,
    mintNode,
    createNode, 
    compoundNode, 
    transferNode, 
    upgradeNode, 
    burnNode,
    pay, 
    claim, 
    multicall,
    getMultiplier,
    getWhitelist
  }
}

export const token = createContainer(useToken)
