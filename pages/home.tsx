import classNames from "classnames"
import { useState } from "react"
import styles from "styles/Home.module.scss"

export default function Home() {
  const [activedTier, activeTier] = useState('basic')
  return (
    <div className="flex flex-col">
      <div className={classNames(styles.welcome, "md:pt-20")}>
        <h1>Welcome Node Grid</h1>
        <p>You can use this app to create Thor Nodes, view, claim and compound rewards.</p>
      </div>
      <div className={classNames(styles.status, "flex flex-wrap justify-between gap-10 md:pt-20")}>
        <ul className="flex-1 flex align-center">
          <li><em>My Nodes :</em> 0 / 100</li>
        </ul>
        <ul className="flex-1">
          <li><em>Total Nodes :</em> 132180</li>
          <li><em>Basic :</em> 30003</li>
          <li><em>Light :</em> 64854</li>
          <li><em>Pro :</em> 21647</li>
        </ul>
        <ul className="flex-1">
          <li><em>Rewards</em></li>
        </ul>
      </div>
      <div className={classNames(styles.create, "md:mt-10")}>
        <h1>Create a Node</h1>
        <p>Choose a warrior to fight for your rewards</p>
        <p>Choose all warriors to unlock the full power of the Bifrost</p>
        <div className={classNames(styles.nodes, "flex flex-wrap justify-around gap-10 md:mt-10")}>
          {[{ name: 'basic' }, { name: 'light' }, { name: 'pro' }].map(tier =>
            <a className={classNames("tier", tier.name, tier.name == activedTier ? styles.selected : "", tier.name == activedTier ? "selected" : "")} onClick={() => activeTier(tier.name)}>
              <h2>{tier.name}</h2>
              <p>1.250 NodeGrid per Node</p>
              <p>Earn 0.02 NodeGrid per Day</p>
            </a>
          )}
        </div>
        <div className={styles.active}>Active Tier: <label>{activedTier}</label></div>
        <div className={classNames(styles.edit, "flex flex-wrap md:flex-nowrap gap-1 md:gap-10")}>
          <input placeholder="Number of Nodes" type="number" />
          <span>Please approve the contract before creating a node if this is your first interaction with NodeGrid.</span>
        </div>
        <div className="flex flex-wrap justify-between mt-4 md:mt-10">
          <button>Approve Contract</button>
          <button>Compound tier rewads</button>
          <button>Create Node</button>
        </div>
        <hr className="my-10" />
        <div className={classNames(styles.buy, "flex align-center")}>
          <div>
            <h2>Create a  Node with $THOR tokens to earn $THOR token rewards.</h2>
            <p>Rewards calculations are based on many factors, including the number of nodes, node revenue, token price, and protocol revenue, and they are variable.</p>
          </div>
          <button className="flex-1 nowrap">Buy NodeGrid</button>
        </div>
      </div>
      <div className={classNames(styles.rules, "md:mt-10")}>
        <h1>Compounding Rules</h1>
        <p>You can only compound in the same tier.</p>
        <p>You can only compound across tiers in god mode.</p>
        <p>To unlock god mode, you need at least 1 node from all the available tiers.</p>
      </div>
    </div>
  )
}
