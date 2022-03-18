import Link from "next/link";
import styles from "styles/Footer.module.scss"

export default function Footer() {
  return (
    <div className={styles.footer}>
       <div className="flex flex-wrap items-center justify-between pt-4">
          <p>
            &copy; 2022 NodeGrid.financial
          </p>


          <ul className="md:flex flex-col md:flex-row md:items-center md:justify-center w-full md:w-auto">
            <li className="mt-3 md:mt-0 md:mr-6">
              <Link href="https://www.twitter.com" passHref>
                <a target="_blank">Twitter</a>
              </Link>
            </li>

            <li className="mt-3 md:mt-0 md:mr-6">
              <Link href="https://www.discord.com" passHref>
                <a target="_blank">Discord</a>
              </Link>
            </li>
          </ul>
       </div>
    </div>
  );
}
