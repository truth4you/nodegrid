import classNames from "classnames"
import Image from "next/image"
import styles from "styles/Dashboard.module.scss"

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className={classNames(styles.welcome, "md:pt-20 flex")}>
        <div>Gain passive income by leveraging THOR's Financial <span>multi-chain yield-farming</span> protocol</div>
        <div className="flex-grow"><Image className="w-full flow-grow" src="/token.png" width={421} height={411} /></div>
      </div>
      <div className={classNames(styles.blogs, "flex flex-wrap justify-between gap-2 md:pt-20")}>
        <h2 className="flex-1">Unbeatable yield potential</h2>
        <h2 className="flex-1">Diversified DeFi</h2>
        <h2 className="flex-1">Secure the Future - Accumulate passive income!</h2>
      </div>
      <div className={classNames(styles.blogs, "flex flex-wrap justify-between gap-2 md:pt-2")}>
        <p className="flex-1">THOR provides a yield potential with a protocol that works. It efficiently aggregates return from protocol-owned liquidity with returns from DeFi protocols across many chains to allocate rewards and yield holders.</p>
        <p className="flex-1">We invest in different DeFi projects, staking pools, NFT's and a host of other carefully curated projects. To ensure we live by our community project policy, the selected projects are published within the community for a vote before we initiate the investment protocol.</p>
        <p className="flex-1">We keep an eye out for bull and bear market patterns so that we can benefit from every market circumstance. There is minimal downtime to our system, it is built by veterans to secure passive income for you and your estate.</p>
      </div>
    </div>
  )
}
