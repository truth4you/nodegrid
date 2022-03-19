import Link from "next/link" // Dynamic routing
import Image from "next/image" // Images
import { eth } from "state/eth" // Global state
import { useEffect, useState } from "react" // State management
import cn from "classnames"
import styles from "styles/Header.module.scss" // Component styles
import Router from "next/router"
import { token } from "state/token"

export default function Header() {
  const { address, unlock, lock } = eth.useContainer()
  const { info } = token.useContainer()
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false)
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setPathname(Router.asPath)
  })
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between pt-4">
        <Link href={'/'} passHref>
          <Image src={"/header-logo.png"} alt="logo" width={137} height={86} />
        </Link>
        <button
          className={cn("flex items-center block px-3 py-2 text-white border rounded md:hidden")}
          onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen)}
        >
          <svg
            className="w-3 h-3 fill-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" fill={"white"} />
          </svg>
        </button>
        <ul className="md:flex flex-col md:flex-row md:items-center md:justify-center w-full md:w-auto hidden md:block">
          {[
            { title: "Home", route: "/" },
            { title: "Team", route: "/team" },
            { title: "Whitepaper", route: "https://nodegrid.gitbook.io/whitepaper/", target: "_blank" },
            { title: "Chart", route: "https://dextools.com/app", target: "_blank" },
            { title: "Buy", route: "https://exchange.pancakeswap.finance/#/swap", target: "_blank" },
            { title: "App", route: "/dashboard" },
            { title: "Presale", route: "/presale", presale: true },
            { title: "Admin", route: "/monitor", owner: true },
          ].filter(route => {
            if (route.owner) return info.isOwner
            if (route.presale) return info.isPresaleAllowed || info.isOwner
            return true
          }).map(({ route, title, target }) => (
            <li className="mt-3 md:mt-0 md:mr-6" key={title}>
              <Link href={route} passHref>
                <a className={cn("text-white hover:text-green-600", pathname == route && styles.active)} target={target}>{title}</a>
              </Link>
            </li>
          ))}
          {!address ?
            <button className={styles.button} onClick={unlock}>Connect</button>
            :
            <button className={styles.button} onClick={lock}>Disconnect</button>}
        </ul>
      </div>
      <div className={cn("z-10 bg-black block md:hidden top-0 left-0 w-full h-auto fixed", mobileMenuIsOpen ? `translate-x-0` : `translate-x-full`)}
        style={{ transition: "transform 200ms linear" }}>
        <div className="container p-8">
          <span className="close_menu mt-10 text-white" onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen)}>close</span>
          <ul
            className="items-center justify-center text-sm w-full h-screen flex flex-col -mt-12"
          >
            {[
              { title: "Home", route: "/" },
              { title: "Team", route: "/team" },
              { title: "Whitepaper", route: "https://nodegrid.gitbook.io/whitepaper/", target: "_blank" },
              { title: "Chart", route: "https://dextools.com/app", target: "_blank" },
              { title: "Buy", route: "https://exchange.pancakeswap.finance/#/swap", target: "_blank" },
              { title: "App", route: "/dashboard" },
              { title: "Presale", route: "/presale" },
              { title: "Admin", route: "/monitor", owner: true },
            ].filter(route => info.isOwner || !route.owner).map(({ route, title, target }) => (
              <li className="mt-5" key={title}>
                <Link href={route} passHref >
                  <a className="block text-white" target={target} onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen)}>{title}</a>
                </Link>
              </li>
            ))}
            <div className={styles.header__actions}>
              {!address ?
                <button className={styles.button} onClick={unlock}>Connect</button>
                :
                <button className={styles.button} onClick={lock}>Disconnect</button>}
            </div>
          </ul>
        </div>
      </div>
    </header>

  )
}
