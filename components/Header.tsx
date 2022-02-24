import Link from "next/link" // Dynamic routing
import Image from "next/image" // Images
import { eth } from "state/eth" // Global state
import { useEffect, useState } from "react" // State management
import cn from "classnames"
import styles from "styles/Header.module.scss" // Component styles
import Router from "next/router"

export default function Header() {
  const { address, unlock, lock } = eth.useContainer()
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false)
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setPathname(Router.asPath)
  })
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between pt-4">
        <Image src={"/header-logo.png"} alt="logo" width={137} height={86} />
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
            { title: "App", route: "/" },
            { title: "Dashboard", route: "/dashboard" },
          ].map(({ route, title }) => (
            <li className="mt-3 md:mt-0 md:mr-6" key={title}>
              <Link href={route} passHref>
                <a className={cn("text-white hover:text-red-600", pathname == route && styles.active)}>{title}</a>
              </Link>
            </li>
          ))}
          {!address ?
            <button className={styles.button} onClick={unlock}>Connect</button>
            :
            <button className={styles.button} onClick={lock}>Disconnect</button>}
        </ul>
      </div>
      <div className={cn("z-20 bg-black block md:hidden absolute top-0 left-0 w-full h-auto", mobileMenuIsOpen ? `translate-x-0` : `translate-x-full`)}
        style={{ transition: "transform 200ms linear" }}>
        <div className="container p-8">
          <span className="close_menu mt-10" onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen)}></span>
          <ul
            className="items-center justify-center text-sm w-full h-screen flex flex-col -mt-12"
          >
            {[
              { title: "App", route: "/createnode" },
              { title: "Dashboard", route: "/dashboard" },
            ].map(({ route, title }) => (
              <li className="mt-5" key={title}>
                <Link href={route} passHref>
                  <a className="block text-white">{title}</a>
                </Link>
              </li>
            ))}
            <div className={styles.header__actions}>
              <button>Connect</button>
            </div>
          </ul>
        </div>
      </div>
    </header>

  )
}
