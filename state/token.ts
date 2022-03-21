import { eth } from "state/eth" // ETH state provider
import { ethers } from "ethers" // Ethers
import { Contract, Provider, setMulticallAddress } from "ethers-multicall"
import { useEffect, useState } from "react" // React
import { createContainer } from "unstated-next" // State management
import { BigNumber } from "@ethersproject/bignumber"
import { parseEther } from "ethers/lib/utils"

const NodeManaferABI = require("abi/NodeManager.json")
const NodePresaleABI = require("abi/NodePresale.json")
const ERC20ABI = require("abi/ERC20.json")
const NftABI = require("abi/BoostNFT.json")
// const MulticallABI = require("abi/Multicall.json")
const UINT256_MAX = '1000000000000000000000000000000000000000000000000000000000000000'
const MULTICALL_ADDRESS = '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
const NODEPRESALE_ADDRESS = '0xFD159C1c635F24587D3CC53fcAC6b7b0359836cc'

let contractNodeGrid: ethers.Contract
let contractToken: ethers.Contract
let contractBusd: ethers.Contract
let contractNFT: ethers.Contract
let contractPresale: ethers.Contract
let tokenAddress: string
let vestAddress: string
let BusdAddress: string
let nftAddress: string

function useToken() {
  const {address,provider} = eth.useContainer()
  const defaultProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  const [tiers, setTiers] = useState<any[]>([])
  const [info, setInfo] = useState<any>({})
  
  const getManager = () => {
    contractNodeGrid = new ethers.Contract(
      String(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
      NodeManaferABI,
      address?provider?.getSigner():defaultProvider
    )
  }

  const getPresale = async () => {
    contractPresale = new ethers.Contract(
      NODEPRESALE_ADDRESS,
      NodePresaleABI,
      address?provider?.getSigner():defaultProvider
    )
    if(!vestAddress)
      vestAddress = await contractPresale.tokenVest()
  }

  const getToken = async () => {
    if(!contractNodeGrid)
      getManager()
    if(!tokenAddress)
      tokenAddress = await contractNodeGrid.tokenAddress()
    contractToken = new ethers.Contract(
      tokenAddress,
      ERC20ABI,
      address?provider?.getSigner():defaultProvider
    )
    if(!BusdAddress)
      BusdAddress = await contractNodeGrid.feeTokenAddress()
    contractBusd = new ethers.Contract(
      BusdAddress,
      ERC20ABI,
      address?provider?.getSigner():defaultProvider
    )

  }

  const getNFT = async () => {
    if(!contractNodeGrid)
      getManager()
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
    getManager()
    return await contractNodeGrid.tiers()
  }

  const getNodes = async (account:string) : Promise<any[]>=>{
    getManager()
    return await contractNodeGrid.nodes(account)
  }

  const getWhitelist = async (supplied:boolean) : Promise<string[]>=>{
    getPresale()
    return await contractPresale.whitelist(supplied)
  }

  const startPresale = async (timeEnd?:Date) => {
    getPresale()
    await(await contractPresale.start(timeEnd ? Math.floor(timeEnd.getTime() / 1000) : 0)).wait()
  }

  const vestPresale = async () => {
    getPresale()
    let isETH = false
    if(!info.presaleTokenSymbol) {
      const token = await contractPresale.tokenVest()
      if(token==='0x0000000000000000000000000000000000000000') isETH = true
    } else
      isETH = info.presaleTokenSymbol==='ETH'
    if(isETH) {
      let value = info.presaleMinCost
      if(!value)
        value = await contractPresale.minVest()
      return await(await contractPresale.vest({value:value})).wait()
    }
    await(await contractPresale.vest()).wait()
  }

  const getUpgradeFee = async (tierTo:string, count:number) : Promise<any>=>{
    getManager()
    return await contractNodeGrid.getUpgradeFee(tierTo,count)
  }

  const getUnpaidNodes = async () : Promise<any[]>=>{
    getManager()
    return await contractNodeGrid.unpaidNodes()
  }

  const createNode = async (tier:string, count:number)=>{
    getManager()
    await(await contractNodeGrid.create(tier, '', count)).wait()
  }

  const compoundNode = async (tier:string, count:number)=>{
    getManager()
    await(await contractNodeGrid.compound(tier, '', count)).wait()
  }

  const transferNode = async (tier:string, count:number, account:string)=>{
    getManager()
    await(await contractNodeGrid.transfer(tier, count, account)).wait()
  }

  const upgradeNode = async (tierFrom:string, tierTo:string, count:number)=>{
    getManager()
    const fee = await getUpgradeFee(tierTo, count)
    await(await contractNodeGrid.upgrade(tierFrom, tierTo, count, {value:fee})).wait()
  }

  const burnNode = async (nodes:number[])=>{
    getManager()
    await(await contractNodeGrid.burnNodes(nodes)).wait()
  }

  const claim = async ()=>{
    getManager()
    await(await contractNodeGrid.claim()).wait()
  }

  const pay = async (months:number,nodes:number[],fee:BigNumber)=>{
    getManager()
    await(await contractNodeGrid.pay(months,nodes,{value:fee.toString()})).wait()
  }

  const mintNode = async (accounts:string[],tierName:string,count:number)=>{
    getManager()
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
  const allowanceBusd = async () : Promise<boolean>=>{
    if(address) {
      await getToken()
      const allowance = await contractBusd.allowance(address, contractNodeGrid.address)
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

  const approveBUSD = async () => {
    await getToken()
    const tx = await contractBusd.approve(contractNodeGrid.address, UINT256_MAX)
    await tx.wait()
  }

  const approvePresale = async () => {
    await getToken()
    await getPresale()
    const token = new ethers.Contract(
      vestAddress,
      ERC20ABI,
      provider?.getSigner()
    )
    const tx = await token.approve(contractPresale.address, UINT256_MAX)
    await tx.wait()
  }

  const multicall = async () => {
    await getToken()
    await getPresale()
    await setMulticallAddress(31337,MULTICALL_ADDRESS)
    const multicall = new Provider(provider??defaultProvider)
    await multicall.init()
    const NodeGrid = new Contract(
      String(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
      NodeManaferABI
    )
    const Presale = new Contract(
      NODEPRESALE_ADDRESS,
      NodePresaleABI
    )
    const Token = new Contract(
      tokenAddress,
      ERC20ABI
    )
    const BUSD = new Contract(
      BusdAddress,
      ERC20ABI
    )
    const Vest = new Contract(
      vestAddress,
      ERC20ABI
    )
    const _tiers = await getTiers()
    setTiers(_tiers)
    const calls = []
    calls.push(NodeGrid.tiers())
    calls.push(NodeGrid.countTotal())
    calls.push(NodeGrid.rewardsTotal())
    // calls.push(NodeGrid.discountPer10())
    calls.push(NodeGrid.transferFee())
    calls.push(NodeGrid.rewardsPoolFee())
    calls.push(NodeGrid.operatorFee())
    calls.push(NodeGrid.maxCountOfUser())
    calls.push(Presale.whitelist(false))
    calls.push(Presale.whitelist(true))
    calls.push(Presale.totalSupply())
    calls.push(Presale.maxSupply())
    calls.push(Presale.totalPlan())
    calls.push(Presale.maxPlan())
    calls.push(Presale.started())
    calls.push(Presale.endTime())
    calls.push(Presale.minVest())
    calls.push(Presale.maxVest())
    calls.push(Presale.tokenVestSymbol())
    if(address) {
      calls.push(multicall.getEthBalance(address))
      calls.push(Token.balanceOf(address))
      calls.push(BUSD.balanceOf(address))
      calls.push(Token.allowance(address,NodeGrid.address))
      calls.push(BUSD.allowance(address,NodeGrid.address))
      calls.push(Vest.allowance(address,Presale.address))
      calls.push(NodeGrid.countOfUser(address))
      calls.push(NodeGrid.claimable())
      calls.push(NodeGrid.owner())
      calls.push(Presale.allowance(address))
      calls.push(Presale.supplies(address))
    }
    _tiers.map(tier=>{
      calls.push(NodeGrid.countOfTier(tier.name))
    })
    const ret = await multicall.all(calls)
    let index = 0
    setTiers(ret[index++])
    info.countTotal = ret[index++]
    info.rewardsTotal = ret[index++]
    // info.discountPer10 = ret[index++]
    info.transferFee = ret[index++]
    info.rewardsPoolFee = ret[index++]
    info.operatorFee = ret[index++]
    info.maxCountOfUser = ret[index++]
    info.presaleAllowance = ret[index++]
    info.presaleSupplied = ret[index++]
    info.presaleTotalSupply = ret[index++]
    info.presaleMaxSupply = ret[index++]
    info.presaleTotalPlan = ret[index++]
    info.presaleMaxPlan = ret[index++]
    info.presaleStarted = ret[index++]
    info.presaleEndTime = ret[index++]
    info.presaleMinCost = ret[index++]
    info.presaleMaxCost = ret[index++]
    info.presaleTokenSymbol = ret[index++]
    if(address) {
      info.balanceETH = ret[index++]
      info.balanceToken = ret[index++]
      info.balanceBUSD = ret[index++]
      info.approvedToken = BigNumber.from(ret[index++]).gt(0)
      info.approvedBUSD = BigNumber.from(ret[index++]).gt(0)
      info.approvedVest = BigNumber.from(ret[index++]).gt(0)
      info.countOfUser = ret[index++]
      info.claimable = ret[index++]
      info.isOwner = ret[index++].toLowerCase()==address.toLowerCase()
      info.isPresaleAllowed = ret[index++]
      info.isPresaleSupplied = ret[index++]
    }
    _tiers.map((tier)=>{
      info[`countOfTier${tier.name}`] = ret[index++]
    })
    setInfo({...info})
  }

  useEffect(()=>{
    if(!tokenAddress) {
      getManager()
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
    allowanceBusd,
    approve, 
    approveBUSD,
    approvePresale,
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
    getWhitelist,
    startPresale,
    vestPresale
  }
}

export const token = createContainer(useToken)
