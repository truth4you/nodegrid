import classNames from "classnames"
import { useEffect, useRef, useState } from "react"
import { eth } from "state/eth"
import { token } from "state/token"
import { formatEther } from "ethers/lib/utils"
import { formatFixed } from "@ethersproject/bignumber"
import styles from "styles/Presale.module.scss"
import { toast } from "react-toastify"

export default function Monitor() {
  const { address } = eth.useContainer()
  const { info, startPresale, vestPresale, getWhitelist, approvePresale, multicall } = token.useContainer()
  const [loading, setLoading] = useState(false)
  const [checkAddress, setAddressCheck] =  useState('')
  const [IsEligible, setEligibility] = useState(false)
  const [timeLimit, setTimeLimit] = useState('0 days 00:00:00')

  const textarea = useRef<HTMLDivElement>(null)

  let isMobile = false;
  if (typeof window !== 'undefined') {
    isMobile = (window.innerWidth <= 600);
  }

  const parseError = (ex: any) => {
    if (typeof ex == 'object')
      return (ex.data?.message ?? null) ? ex.data.message.replace('execution reverted: ', '') : ex.message
    return ex
  }

  const handleInputAddress = (e: any) => {
    const text = e.target.value
    if (text == '0' || text == '0x' || /^0x[0-9a-f]{0,40}$/i.test(text)) {
      setAddressCheck(text)
    }
  }

  const handleDownloadWhitelist = () => {
    getWhitelist(false).then(accounts => {
      var link = document.createElement('a')
      let text = ''
      for (const account of accounts) {
        text += `${account}\n`
      }
      link.href = 'data:text/plain;charset=UTF-8,' + escape(text)
      link.download = `whitelist.csv`
      link.click()
    })
  }
  const handleCheckWhitelist = () => {
    if(checkAddress=='')
    toast.error('Please enter wallet address')
    setEligibility(false)
    getWhitelist(false).then(accounts => {
      
      for (const account of accounts) {
       if(account == checkAddress)
        setEligibility(true)
      }
      
    })
  }

  const handleVest = () => {
    setLoading(true)
    try {
      vestPresale().then(async () => {
        toast.success(`Successfully sent!`)
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

  const handleApprove = () => {
    setLoading(true)
    try {
      approvePresale().then(async () => {
        toast.success(`Successfully approved!`)
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


  const handleStart = () => {
    setLoading(true)
    try {
      startPresale().then(async () => {
        toast.success(`Successfully started!`)
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

  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.floor(info.presaleEndTime?.toNumber() - new Date().getTime() / 1000)
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      setTimeLimit(`${days} days ${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`)
    }, 500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={classNames(loading ? "loading" : "", "flex flex-col")}>
      <div className={classNames(styles.welcome, "pt-10 md:pt-20")}>
        <h1>Welcome Node Grid Presale</h1>
        <p>You can use this app to pre-purchase NodeGrid Nodes, with only {formatEther(info.presaleMinCost ?? 0)} {info.presaleTokenSymbol ?? 'BUSD'}.</p>
      </div>
      <div className={classNames(styles.whitelist, "md:mt-10 mt-5")}>
        <h3>NodeGrid will be hosting a Whitelist on April 1st, 2022, at 17:00 UTC. Please use the application to check your eligibility. More information regarding the premise of the Whitelist can be found on our GitBook.</h3>
      </div>
      <div className={classNames(styles.whitelist, "md:mt-10 mt-5")}>
        <h3>Check your eligability for whitelist by copy and pasting your BEP-20 wallet address below:</h3>
        <div className={classNames(styles.inputBox,"md:mt-1 mt-5")}>
          <input type="text" name="walletAddress" value={checkAddress}  onInput={handleInputAddress}/>
          <button onClick={handleCheckWhitelist}>Check</button>
        </div>
        <h3 className="mt-5">Eligiblity Status: <span style={{color:'white'}}>{IsEligible?'Eligible':'Not Eligible'}</span></h3>
      </div>
      <div className={classNames(styles.whitelist, "md:mt-10 mt-5")}>
        <h1>Whitelist Statistics</h1>
        <h3>Whitelist Slots Outstanding: <span style={{color: 'white'}}>{info.presaleMaxPlan?.toNumber() - info.presaleTotalPlan?.toNumber()}</span></h3>
        <h3>Whitelist Spots Left To Claim:  <span style={{color: 'white'}}>{info.presaleMaxSupply?.toNumber() - info.presaleTotalSupply?.toNumber()}</span></h3>
        <h3 style={{textAlign:'center'}}>Whitelist is <span style={{color: 'white'}}>{info.presaleTotalPlan?.toNumber()*100/info.presaleMaxPlan?.toNumber()}%</span> filled</h3>
        <div className={styles.progressBar}>
          <div style={{width: `${info.presaleTotalPlan?.toNumber()*100/info.presaleMaxPlan?.toNumber()}%`}}></div>
        </div>
        {info.presaleStarted && info.presaleEndTime > Math.floor(new Date().getTime() / 1000) && <p>Ends in <strong>{timeLimit}</strong></p>}
        <div className="flex flex-wrap gap-4 mt-4 justify-end">
          {info.isPresaleAllowed && info.isPresaleSupplied && info.presaleStarted &&
            (info.approvedVest ?
              <button onClick={handleVest} className="w-full md:w-auto">Send {formatEther(info.presaleMinCost ?? 0)} {info.presaleTokenSymbol ?? 'BUSD'}</button> :
              <button onClick={handleApprove} className="w-full md:w-auto">Approve {info.presaleTokenSymbol ?? 'BUSD'}</button>)
          }
          {info.isOwner && !info.presaleStarted &&
            <button onClick={handleStart} className="w-full md:w-auto">Start right now</button>}
        </div>
      </div>
      {/* <div className={classNames(styles.whitelist, "md:mt-10 mt-5")}>
        <h1>Whitelist for presale</h1>
        <p>Our company would like to presale to our honest customers.</p>
        <p>You can download whitelist accounts by clicking WHITELIST button and find yourself.</p>
        <div className="flex flex-wrap gap-4 mt-4 justify-end">
          <button onClick={handleDownloadWhitelist} className="w-full md:w-auto">Download Whitelist</button>
        </div>
      </div> */}
    </div >
  )
}
