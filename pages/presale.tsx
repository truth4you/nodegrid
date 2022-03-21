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
      const seconds = Math.floor(info.presaleEndTime.toNumber() - new Date().getTime() / 1000)
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
        <h1>Presale</h1>
        <p>Total number of whitelist : <strong>{info.presaleTotalPlan?.toNumber()} / {info.presaleMaxPlan?.toNumber()}</strong></p>
        <p>Total number of buyers : <strong>{info.presaleTotalSupply?.toNumber()} / {info.presaleMaxSupply?.toNumber()}</strong></p>
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
      <div className={classNames(styles.whitelist, "md:mt-10 mt-5")}>
        <h1>Whitelist for presale</h1>
        <p>Our company would like to presale to our honest customers.</p>
        <p>You can download whitelist accounts by clicking WHITELIST button and find yourself.</p>
        <div className="flex flex-wrap gap-4 mt-4 justify-end">
          <button onClick={handleDownloadWhitelist} className="w-full md:w-auto">Download Whitelist</button>
        </div>
      </div>
    </div >
  )
}
