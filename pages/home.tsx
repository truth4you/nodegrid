import classNames from "classnames"
import { useEffect, useRef, useState } from "react"
import { eth } from "state/eth"
import { token } from "state/token"
import { formatEther } from "ethers/lib/utils"
import { formatFixed } from "@ethersproject/bignumber"
import styles from "styles/Home.module.scss"
import { toast } from "react-toastify"
import Link from "next/link"

export default function Home() {
  const { address } = eth.useContainer()
  const { info, tiers, allowance, getNodes, approve, createNode, compoundNode, transferNode, upgradeNode, claim, pay, multicall } = token.useContainer()
  const [approved, setApproved] = useState(false)
  const [nodes, setNodes] = useState<any[]>([])
  const [activedTier, activeTier] = useState('')
  const [countCreate, setCountCreate] = useState(0)
  const [countUpgrade, setCountUpgrade] = useState(0)
  const [addressTransfer, setAddressTransfer] = useState('')
  const [showingTransfer, showTransfer] = useState(false)
  const [filterTier, setFilterTier] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)

  const parseError = (ex: any) => {
    if (typeof ex == 'object')
      return (ex.data?.message ?? null) ? ex.data.message.replace('execution reverted: ', '') : ex.message
    return ex
  }

  const formatTime = (time: number) => {
    return new Date(time * 1000).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatDays = (time: number) => {
    const days = Math.floor((time - new Date().getTime() / 1000) / 86400)
    if (days < 0)
      return <span className="text-red-500">{-days} days</span>
    return <span className="text-green-500">{days} days</span>
  }

  const calcRewards = (node: any) => {
    const tier = findTier(node.tierIndex)
    const diff = new Date().getTime() - node.claimedTime * 1000
    if (diff <= 0) return 0
    return tier?.rewardsPerTime.mul(diff).div(tier.claimInterval).div(1000) ?? 0
  }

  const handleApprove = () => {
    setLoading(true)
    try {
      approve().then(() => {
        toast.success(`Successfully approved!`)
        setApproved(true)
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handleCreate = () => {
    if (countCreate == 0) {
      toast.warning('Input number of nodes.')
      return
    }
    setLoading(true)
    try {
      createNode(activedTier, countCreate).then(async () => {
        toast.success(`Successfully created ${countCreate} nodes!`)
        if (address) getNodes(address).then(nodes => setNodes(nodes))
        setCountCreate(0)
        await multicall()
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handleCompound = () => {
    if (countCreate == 0) {
      toast.warning('Input number of nodes.')
      return
    }
    setLoading(true)
    try {
      compoundNode(activedTier, countCreate).then(async () => {
        toast.success(`Successfully compounded ${countCreate} nodes!`)
        if (address) getNodes(address).then(nodes => setNodes(nodes))
        setCountCreate(0)
        await multicall()
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handleShowTransfer = () => {
    if (countCreate == 0) {
      toast.warning('Input number of nodes.')
      return
    }
    showTransfer(true)
  }

  const handleInputAddress = (e: any) => {
    const text = e.target.value
    if (text == '0' || text == '0x' || /^0x[0-9a-f]{0,40}$/i.test(text)) {
      setAddressTransfer(text)
    }
  }

  const handleTransfer = () => {
    if (countCreate == 0) {
      toast.warning('Input number of nodes.')
      return
    } else if (addressTransfer == '') {
      toast.warning('Input address of recipient.')
      return
    }
    setLoading(true)
    try {
      transferNode(activedTier, countCreate, addressTransfer).then(async () => {
        toast.success(`Successfully transfered ${countCreate} nodes!`)
        if (address) getNodes(address).then(nodes => setNodes(nodes))
        await multicall()
        setCountCreate(0)
        setAddressTransfer('')
        showTransfer(false)
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handleUpgrade = (tierName1: string, tierName2: string) => {
    if (countUpgrade == 0) {
      toast.warning('Input number of nodes.')
      return
    }
    setLoading(true)
    try {
      upgradeNode(tierName1, tierName2, countUpgrade).then(async () => {
        toast.success(`Successfully upgraded ${countUpgrade} nodes!`)
        if (address) getNodes(address).then(nodes => setNodes(nodes))
        await multicall()
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handleClaim = () => {
    setLoading(true)
    try {
      claim().then(async () => {
        toast.success(`Successfully claimed!`)
        if (address) getNodes(address).then(nodes => setNodes(nodes))
        await multicall()
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handlePay = (months: number) => {
    setLoading(true)
    try {
      pay(months).then(async () => {
        toast.success(`Successfully paid!`)
        if (address) getNodes(address).then(nodes => setNodes(nodes))
        await multicall()
        setLoading(false)
      }).catch(ex => {
        toast.error(parseError(ex))
        setLoading(false)
      })
    } catch (ex) {
      toast.error(parseError(ex))
      setLoading(false)
    }
  }

  const handleCountCreate = (e: any) => {
    setCountCreate(Number(e.target.value))
  }

  const handleCountUpgrade = (e: any) => {
    setCountUpgrade(Number(e.target.value))
  }

  const findTier = (tierIndex: number) => {
    if (tiers.length) for (const tier of tiers) {
      if (tier.id == tierIndex)
        return tier
    }
    return undefined
  }

  useEffect(() => {
    if (address) {
      getNodes(address).then(nodes => setNodes(nodes))
      allowance().then(approved => setApproved(approved))
      multicall()
    }
  }, [address])
  useEffect(() => {
    if (activedTier == '' && tiers[0]) activeTier(tiers[0].name)
  }, [tiers])
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(timer + 1)
    }, 300)
    return () => clearInterval(interval)
  }, [timer])
  return (
    <div className={classNames(loading ? "loading" : "", "flex flex-col")}>
      <div className={classNames(styles.welcome, "pt-10 md:pt-20")}>
        <h1>Welcome Node Grid</h1>
        <p>You can use this app to create Thor Nodes, view, claim and compound rewards.</p>
      </div>
      <div className={classNames(styles.status, "flex flex-wrap justify-between md:gap-10 gap-5 md:pt-20 pt-10")}>
        <ul className="flex-1">
          <li><em>My Nodes :</em> {info.countOfUser ?? 0} / {info.maxCountOfUser ?? 'Infinite'}</li>
          {tiers.map((tier, index) =>
            <li key={`my-node-${tier.name}`}>
              <em>{tier.name} :</em> {nodes.filter(node => node.tierIndex == index).length}
            </li>
          )}
        </ul>
        <ul className="flex-1">
          <li><em>Total Nodes :</em> {info.countTotal ?? 0}</li>
          {tiers.map(tier =>
            <li key={`total-node-${tier.name}`}><em>{tier.name} :</em> {info[`countOfTier${tier.name}`] ?? 0}</li>
          )}
        </ul>
        <ul className="flex-1 flex flex-col justify-between">
          <li><em>Rewards</em></li>
          <ins>
            {nodes.length > 0 ? [...nodes].map((node) => parseFloat(formatEther(calcRewards(node)))).reduce((a, b) => a + b).toFixed(8) : null}
          </ins>
          <ins><button className="w-full" onClick={handleClaim}>Claim Rewards</button></ins>
        </ul>
      </div>
      <div className={classNames(styles.create, "md:mt-10 mt-5")}>
        <h1>Create a Node</h1>
        <p>Choose a warrior to fight for your rewards</p>
        <p>Choose all warriors to unlock the full power of the Bifrost</p>
        <div className={classNames(styles.tiers, "flex flex-wrap justify-around md:gap-10 gap-5 md:mt-10")}>
          {tiers.map(tier =>
            <a className={classNames("tier w-full md:w-auto", tier.name, tier.name == activedTier ? styles.selected : "", tier.name == activedTier ? "selected" : "")} key={tier.name} onClick={() => activeTier(tier.name)}>
              <h2>{tier.name}</h2>
              <p>{formatEther(tier.price)} NodeGrid per Node</p>
              <p>Earn {formatEther(tier.rewardsPerTime)} NodeGrid per Day</p>
            </a>
          )}
        </div>
        <div className={styles.active}>Active Tier: <label>{activedTier}</label></div>
        <div className={classNames(styles.edit, "flex flex-wrap md:flex-nowrap gap-1 md:gap-10")}>
          <input placeholder="Number of Nodes" type="number" defaultValue={countCreate ? countCreate : ''} onChange={handleCountCreate} />
          <span>Please approve the contract before creating a node if this is your first interaction with NodeGrid.</span>
        </div>
        {showingTransfer ?
          <>
          <div className={classNames(styles.group, "md:flex gap-1 mt-4 mt-10 hidden md:block")}>
            <input placeholder="Address of Recipient" type="text" className="flex-1 w-full mb-2" value={addressTransfer} onInput={handleInputAddress} />
            <button disabled={nodes.length == 0} onClick={handleTransfer}>Confirm</button>
            <button disabled={nodes.length == 0} onClick={() => showTransfer(false)}>Cancel</button>
          </div>
          <div className={"md:flex gap-1 mt-4 mt-10 md:hidden"}>
            <input placeholder="Address of Recipient" type="text" className="flex-1 w-full mb-2" value={addressTransfer} onInput={handleInputAddress} />
            <button disabled={nodes.length == 0} onClick={handleTransfer} className={"mr-4"}>Confirm</button>
            <button disabled={nodes.length == 0} onClick={() => showTransfer(false)}>Cancel</button>
          </div>
          </>
           :
          <div className="flex flex-wrap justify-between mt-4 md:mt-10">
            {approved ?
              <button disabled className={classNames(styles.approved,"w-full md:w-auto")}>Approved</button> :
              <button onClick={handleApprove} className="w-full md:w-auto">Approve Contract</button>}
            <button disabled={!approved} onClick={handleCreate} className="w-full md:w-auto">Create Nodes</button>
            <button disabled={!approved} onClick={handleCompound} className="w-full md:w-auto">Compound Nodes</button>
            <button disabled={nodes.length == 0} onClick={handleShowTransfer} className="w-full md:w-auto">Transfer Nodes</button>
          </div>}
        <hr className="my-10" />
        <div className={styles.upgrade}>
          <h2>Upgrade Nodes</h2>
          <p>Upgrading nodes to higher tier needs tokens that equals with difference of tiers' prices.</p>
          <div className="flex flex-wrap justify-between mt-4 md:mt-10">
            <input placeholder="Number of Nodes" type="number" defaultValue={countUpgrade ? countUpgrade : ''} onChange={handleCountUpgrade} />
            <div className={classNames(styles.group, "flex gap-1 mt-3 md:m-0")}>
              {tiers.map((tier1) =>
                tiers.filter((tier2) => tier1.price.lt(tier2.price)).map((tier2) =>
                  <button disabled={!approved || nodes.length == 0 || countUpgrade == 0} onClick={() => handleUpgrade(tier1.name, tier2.name)} key={`upgrade-${tier1.id}-${tier2.id}`}>
                    {tier1.name.toUpperCase()} &rArr; {tier2.name.toUpperCase()}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        <hr className="my-10" />
        <div className={classNames(styles.buy, "md:flex align-center")}>
          <div>
            <h2>Create a  Node with NodeGrid tokens to earn NodeGrid token rewards.</h2>
            <p>Rewards calculations are based on many factors, including the number of nodes, node revenue, token price, and protocol revenue, and they are variable.</p>
          </div>
          <Link  href="https://testnet.godex.exchange/swap?outputCurrency=0x25A6dC9DB7E0e862Db0B6b3e3612705bbCAd6E03" >
            <a target="_blank">
              <button className="flex-1 nowrap">Buy NodeGrid</button>
            </a>
          </Link>
        </div>
      </div>
      {nodes.length>0 && <div className={classNames(styles.nodes, "md:mt-10 mt-5")}>
        <div className="md:flex justify-between items-end mb-4">
          <h1>Nodes</h1>
          <div className={classNames(styles.group, "flex gap-1 mt-2")}>
            <button onClick={() => setFilterTier(-1)} className={filterTier == -1 ? styles.selected : ""}>All</button>
            {tiers.map((tier, index) =>
              <button onClick={() => setFilterTier(index)} className={filterTier == index ? styles.selected : ""}>{tier.name}</button>
            )}
          </div>
        </div>
        <table className="table-auto border-collapse">
          <thead>
            <tr>
              {/* <th>Title</th> */}
              <th>#</th>
              <th>Tier</th>
              <th className="hidden md:block">Creation Time</th>
              <th>Limited</th>
              <th>Rewards</th>
            </tr>
          </thead>
          <tbody className={`${timer}`}>
            {[...nodes].filter(node => {
              if (filterTier == -1)
                return true
              return node.tierIndex == filterTier
            }).sort((a: any, b: any) => {
              if (a.tierIndex > b.tierIndex) return -1
              else if (a.tierIndex == b.tierIndex && a.createdTime < b.createdTime) return -1
              return 1
            }).map((node, index) =>
              <tr key={index}>
                {/* <td>{node.title}</td> */}
                <td>{index + 1}</td>
                <td><span className="uppercase">{findTier(node.tierIndex)?.name}</span></td>
                <td className="hidden md:block" >{formatTime(node.createdTime)}</td>
                <td>{formatDays(node.limitedTime)}</td>
                <td>{parseFloat(formatEther(calcRewards(node))).toFixed(5)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>}
      <div className={classNames(styles.rules, "md:mt-10 mt-5")}>
        <h1>Compounding Rules</h1>
        <p>You can only compound in the same tier.</p>
        <p>You can only compound across tiers in god mode.</p>
        <p>To unlock god mode, you need at least 1 node from all the available tiers.</p>

        <hr className="my-10" />
        <div className={classNames(styles.pay)}>
          <div>
            <h1>Pay maintenance fee every month</h1>
            <p>You need to pay maintaince fees end of the month And You have time to pay upto 1 more month but if not paid for 2 months nodes will be burnt</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-end">
            <button onClick={() => handlePay(1)}>Pay 1 Month</button>
            <button onClick={() => handlePay(2)}>Pay 2 Months</button>
          </div>
        </div>
      </div>
    </div >
  )
}
