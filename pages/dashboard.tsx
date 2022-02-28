import classNames from "classnames"
import Image from "next/image"
import styles from "styles/Dashboard.module.scss"

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className={classNames(styles.welcome, "pt-10 md:pt-20 md:flex")}>
        <div className="text-2xl md:text-5xl">Gain passive income by leveraging NODEGRID's Financial <span>multi-chain yield-farming</span> protocol</div>
        <div className="flex-grow m-10"><Image className="w-full flow-grow" src="/pro.png" width={421} height={421} /></div>
      </div>
      <div className={classNames(styles.blogs, "md:flex flex-wrap justify-between gap-2 md:pt-20")}>
        <div className="flex-1">
          <h2 className="flex-1 mb-4">Unbeatable yield potential</h2>
          <p className="flex-1">NODEGRID provides a yield potential with a protocol that works. It efficiently aggregates return from protocol-owned liquidity with returns from DeFi protocols across many chains to allocate rewards and yield holders.</p>
        </div>
        <div className="flex-1">
          <h2 className="flex-1  mb-4">Diversified DeFi</h2>
          <p className="flex-1">We invest in different DeFi projects, staking pools, NFT's and a host of other carefully curated projects. To ensure we live by our community project policy, the selected projects are published within the community for a vote before we initiate the investment protocol.</p>
        </div>
        <div className="flex-1">
          <h2 className="flex-1  mb-4">Secure the Future - Accumulate passive income!</h2>
          <p className="flex-1">We keep an eye out for bull and bear market patterns so that we can benefit from every market circumstance. There is minimal downtime to our system, it is built by veterans to secure passive income for you and your estate.</p>
        </div>
      </div>
      <div className={classNames(styles.howit, "pt-10 text-center")}>
        <h2 className="uppercase">How It Works</h2>
        <div className="md:flex justify-between gap-2 pt-5">
          <div className="w-full md:w-1/2">
            <p><span>Buy</span> NODEGRID tokens, <span>create a Nodes and </span>earn daily rewards.</p>
          </div>
          <div className="w-full md:w-1/2">
            <p>Our objective <span>is to help as many to generate passive income continuously with minimal effort. This is the reward people truly deserve and we are bringing this to you.</span></p>
          </div>
        </div>
        
        
      </div>
    </div>
  )
}
