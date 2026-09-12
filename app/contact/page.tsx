"use client";
import Footer from '../components/Footer';
import TopAppBar from "../components/TopAppBar";
import { Discord, Telegram } from '@thatjoshguy/oneui-icons';

function ContactLink({ href, label, detail, icon: Icon }: { href: string; label: string; detail: string; icon: typeof Discord }) {
  return (
    <a href={href} className="list" target="_blank" rel="noopener noreferrer">
      <div className="list-item-icon" aria-hidden="true"><Icon size={24} color="var(--accent)" /></div>
      <div className="list-item-content">
        <div className="body-text">{label}</div>
        <div className="information-wrapper"><div className="information">{detail}</div></div>
      </div>
      <div className="list-item-chevron" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </a>
  );
}

export default function Contact() {
  return (
    <div className="page contact-page">
      <div className="page-body">
        <div className="main-content" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards', opacity: 0 }}>
          <TopAppBar
            title="Contact"
            hideBarTitleOnMobile
            mobileSettingsHref="/settings?from=%2Fcontact"
          />
          <div className="card-columns-layout">
            <div className="card-column">
              <div className="section">
                <div className="section-header">
                  <h2 className="title">Support my work</h2>
                </div>
                <a href="https://www.paypal.com/paypalme/ThatJoshGuy690" className="list" target="_blank" rel="noopener noreferrer" aria-label="Donate via PayPal">
                  <div className="list-item-icon">
                    {/* PayPal Heart SVG */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.6505 18.8783C11.4275 19.5403 12.5725 19.5403 13.3505 18.8783C15.1965 17.3053 18.4085 14.4672 19.5385 12.8872C19.6415 12.7413 19.9345 12.3022 19.9345 12.3022C20.3795 11.5352 20.6355 10.6322 20.6355 9.66434C20.6355 6.88124 18.5095 4.62524 15.8855 4.62524C14.2795 4.62524 12.8595 5.47224 12.0005 6.76924C11.1405 5.47224 9.7205 4.62524 8.1135 4.62524C5.4905 4.62524 3.3645 6.88124 3.3645 9.66434C3.3645 10.6322 3.6225 11.5352 4.0665 12.3022C4.0665 12.3022 4.3585 12.7413 4.4625 12.8872C5.5915 14.4672 8.8035 17.3053 10.6505 18.8783Z" fill="var(--accent)"/>
                    </svg>
                  </div>
                  <div className="list-item-content">
                    <div className="body-text">Donate</div>
                  </div>
                  <div className="list-item-chevron">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="Shape">
                        <path id="Vector 3" d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round"/>
                      </g>
                    </svg>
                  </div>
                </a>
              </div>
              <div className="section">
                <div className="section-header">
                  <h2 className="title">Hit me up</h2>
                </div>
                <div className="list-group">
                  <a href="https://twitter.com/thatjoshguy69" className="list" target="_blank" rel="noopener noreferrer">
                    <div className="list-item-icon">
                      {/* Twitter SVG */}
                      <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.3823 4.81864C21.3968 5.02864 21.3968 5.23864 21.3968 5.45058C21.3968 11.9083 16.4806 19.3561 7.49129 19.3561V19.3522C4.83581 19.3561 2.23548 18.5954 0 17.1612C0.386129 17.2077 0.774194 17.2309 1.16323 17.2319C3.36387 17.2338 5.50161 16.4954 7.2329 15.1357C5.14161 15.0961 3.30774 13.7325 2.6671 11.7419C3.39968 11.8832 4.15452 11.8541 4.87355 11.6577C2.59355 11.197 0.953226 9.1938 0.953226 6.86735V6.80542C1.63258 7.1838 2.39323 7.3938 3.17129 7.41703C1.02387 5.98187 0.361935 3.12509 1.65871 0.891544C4.14 3.94477 7.80097 5.8009 11.731 5.99735C11.3371 4.29993 11.8752 2.52122 13.1448 1.328C15.1132 -0.522327 18.209 -0.427488 20.0594 1.53993C21.1539 1.32412 22.2029 0.922512 23.1629 0.35348C22.7981 1.48477 22.0345 2.44574 21.0145 3.05638C21.9832 2.94219 22.9297 2.68283 23.821 2.28703C23.1648 3.27025 22.3384 4.12671 21.3823 4.81864Z" fill="var(--accent)"/>
                      </svg>
                    </div>
                    <div className="list-item-content">
                      <div className="body-text">Twitter</div>
                      <div className="information-wrapper">
                        <div className="information">@thatjoshguy69</div>
                      </div>
                    </div>
                    <div className="list-item-chevron">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="Shape">
                          <path id="Vector 3" d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                  </a>
                  <a href="mailto:email@thatjoshguy.me" className="list">
                    <div className="list-item-icon">
                      {/* Email SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.307 8.67L12.411 13.001C12.279 13.099 12.122 13.147 11.967 13.147C11.809 13.147 11.652 13.098 11.519 12.999L5.69 8.668C5.358 8.421 5.289 7.951 5.536 7.618C5.783 7.286 6.253 7.217 6.585 7.464L11.969 11.464L17.419 7.461C17.752 7.216 18.222 7.287 18.468 7.622C18.713 7.955 18.641 8.425 18.307 8.67ZM18.25 4.625H5.75C4.375 4.625 3.25 5.75 3.25 7.125V16.875C3.25 18.25 4.375 19.375 5.75 19.375H18.25C19.625 19.375 20.75 18.25 20.75 16.875V7.125C20.75 5.75 19.625 4.625 18.25 4.625Z" fill="var(--accent)"/>
                      </svg>
                    </div>
                    <div className="list-item-content">
                      <div className="body-text">Email</div>
                      <div className="information-wrapper">
                        <div className="information">email@thatjoshguy.me</div>
                      </div>
                    </div>
                    <div className="list-item-chevron">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="Shape">
                          <path id="Vector 3" d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                  </a>
                  <ContactLink href="https://discord.gg/dRhJ78YH6M" label="Discord" detail="Join the TJG Discord server" icon={Discord} />
                </div>
              </div>
            </div>
            <div className="card-column">
              <div className="section">
                <div className="section-header">
                  <h2 className="title">My socials</h2>
                </div>
                <div className="list-group">
                  <a href="https://bsky.app/profile/thatjoshguy.me/" className="list" target="_blank" rel="noopener noreferrer">
                    <div className="list-item-icon">
                      {/* Bluesky SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10.6473C10.9133 8.26964 7.95386 3.83863 5.20231 1.6533C2.56647 -0.440125 1.56093 -0.0774049 0.901733 0.257696C0.138729 0.645566 0 1.96339 0 2.73873C0 3.51406 0.377832 9.09539 0.624277 10.027C1.43857 13.1053 4.33735 14.1455 7.00693 13.8117C7.14339 13.7889 7.28179 13.7679 7.42193 13.7484C7.28446 13.7731 7.14599 13.7943 7.00693 13.8117C3.09469 14.4635 -0.379747 16.0675 4.17721 21.7747C9.18986 27.6135 11.047 20.5228 12 16.9276C12.953 20.5228 14.0507 27.3578 19.733 21.7747C24 16.9276 20.9053 14.4637 16.9931 13.8118C16.854 13.7944 16.7155 13.7734 16.5781 13.7486C16.7182 13.768 16.8566 13.7891 16.9931 13.8118C19.6626 14.1457 22.5614 13.1055 23.3757 10.0273C23.6222 9.09562 24 3.51426 24 2.73892C24 1.96358 23.8612 0.645759 23.0982 0.257888C22.439 -0.0772114 21.4335 -0.439931 18.7977 1.65349C16.0461 3.83882 13.0867 8.26964 12 10.6473Z" fill="var(--accent)"/></svg>
                    </div>
                    <div className="list-item-content">
                      <div className="body-text">Bluesky</div>
                      <div className="information-wrapper">
                        <div className="information">thatjoshguy.me</div>
                      </div>
                    </div>
                    <div className="list-item-chevron">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="Shape">
                          <path id="Vector 3" d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                  </a>
                  <a href="https://instagram.com/thatjoshguy69/" className="list" target="_blank" rel="noopener noreferrer">
                    <div className="list-item-icon">
                      {/* Instagram SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.03017 0.0839254C5.75336 0.144166 4.88143 0.347926 4.11918 0.647447C3.33029 0.954888 2.66165 1.36745 1.99636 2.03513C1.33107 2.70281 0.921389 3.37194 0.616106 4.16202C0.320663 4.92594 0.120501 5.79859 0.0641001 7.07611C0.00769954 8.35363 -0.00478059 8.76428 0.00145947 12.023C0.00769954 15.2817 0.0220997 15.6902 0.0840203 16.9704C0.144981 18.2469 0.348023 19.1186 0.647546 19.8811C0.955469 20.67 1.36755 21.3384 2.03548 22.0039C2.70341 22.6694 3.37205 23.0782 4.16406 23.3839C4.92727 23.6789 5.80016 23.88 7.07745 23.9359C8.35475 23.9919 8.76587 24.0048 12.0237 23.9986C15.2815 23.9923 15.6916 23.9779 16.9716 23.9172C18.2515 23.8565 19.1186 23.652 19.8813 23.3539C20.6702 23.0453 21.3391 22.6339 22.0042 21.9658C22.6692 21.2976 23.0787 20.628 23.3837 19.8374C23.6794 19.0742 23.8803 18.2014 23.9357 16.925C23.9916 15.6441 24.0048 15.2352 23.9986 11.9769C23.9923 8.71868 23.9777 8.31019 23.917 7.03051C23.8563 5.75083 23.653 4.88178 23.3537 4.11882C23.0453 3.32994 22.6337 2.66201 21.966 1.99601C21.2983 1.33001 20.6282 0.920808 19.8379 0.616487C19.0742 0.321046 18.2018 0.119686 16.9245 0.0644854C15.6472 0.00928517 15.2361 -0.00487488 11.9771 0.00136514C8.71811 0.00760516 8.3101 0.0215252 7.03017 0.0839254ZM7.17033 21.7771C6.00032 21.7262 5.36503 21.5318 4.94167 21.3691C4.38102 21.1531 3.98166 20.892 3.55974 20.4742C3.13781 20.0563 2.87861 19.6555 2.65973 19.0961C2.49532 18.6727 2.29732 18.0381 2.2426 16.8681C2.18308 15.6036 2.1706 15.2239 2.16364 12.0201C2.15668 8.81636 2.16892 8.43715 2.22436 7.17211C2.27428 6.00307 2.46988 5.36706 2.63237 4.94394C2.84837 4.38258 3.10853 3.98394 3.52734 3.56226C3.94614 3.14058 4.34574 2.8809 4.90567 2.66201C5.32855 2.49689 5.96312 2.30057 7.13265 2.24489C8.39819 2.18489 8.77739 2.17289 11.9807 2.16593C15.184 2.15897 15.5642 2.17097 16.8302 2.22665C17.9992 2.27753 18.6355 2.47121 19.0581 2.63465C19.619 2.85066 20.0181 3.1101 20.4398 3.52962C20.8615 3.94914 21.1214 4.3473 21.3403 4.90842C21.5057 5.3301 21.702 5.96443 21.7572 7.13467C21.8174 8.40019 21.8311 8.77964 21.8369 11.9827C21.8426 15.1857 21.8314 15.5661 21.7759 16.8307C21.7248 18.0007 21.5309 18.6362 21.3679 19.0601C21.1519 19.6205 20.8915 20.0201 20.4725 20.4415C20.0534 20.863 19.6543 21.1226 19.0941 21.3415C18.6717 21.5064 18.0364 21.7032 16.8679 21.7589C15.6023 21.8184 15.2231 21.8309 12.0186 21.8378C8.81411 21.8448 8.43611 21.8318 7.17057 21.7771M16.9531 5.58643C16.9535 5.87125 17.0385 6.14954 17.1971 6.38609C17.3558 6.62265 17.581 6.80684 17.8443 6.91538C18.1077 7.02391 18.3973 7.05192 18.6765 6.99585C18.9558 6.93978 19.2122 6.80216 19.4132 6.60039C19.6142 6.39862 19.7509 6.14176 19.806 5.8623C19.861 5.58285 19.8319 5.29334 19.7224 5.03041C19.6129 4.76747 19.4279 4.54291 19.1908 4.38514C18.9536 4.22736 18.675 4.14345 18.3902 4.14402C18.0084 4.14478 17.6425 4.29716 17.373 4.56765C17.1035 4.83814 16.9524 5.20459 16.9531 5.58643ZM5.83856 12.012C5.84528 15.4152 8.60915 18.1677 12.0117 18.1613C15.4142 18.1548 18.1687 15.3912 18.1622 11.988C18.1557 8.58476 15.3911 5.83147 11.9881 5.83819C8.58515 5.84491 5.83208 8.60924 5.83856 12.012ZM8.00002 12.0076C7.99846 11.2165 8.23153 10.4427 8.66977 9.78399C9.108 9.12531 9.73172 8.61137 10.462 8.30717C11.1924 8.00296 11.9965 7.92216 12.7728 8.07496C13.549 8.22777 14.2625 8.60733 14.823 9.16565C15.3836 9.72396 15.766 10.436 15.9218 11.2116C16.0777 11.9872 16.0001 12.7917 15.6988 13.5232C15.3975 14.2547 14.886 14.8804 14.2291 15.3213C13.5721 15.7621 12.7992 15.9983 12.0081 15.9998C11.4827 16.0009 10.9623 15.8985 10.4766 15.6985C9.99086 15.4985 9.54928 15.2047 9.17709 14.834C8.80489 14.4632 8.50938 14.0228 8.30741 13.5379C8.10545 13.0529 8.001 12.533 8.00002 12.0076Z" fill="var(--accent)"/></svg>
                    </div>
                    <div className="list-item-content">
                      <div className="body-text">Instagram</div>
                      <div className="information-wrapper">
                        <div className="information">thatjoshguy69</div>
                      </div>
                    </div>
                    <div className="list-item-chevron">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="Shape">
                          <path id="Vector 3" d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                  </a>
                  <a href="https://youtube.com/@thatjoshguy08/" className="list" target="_blank" rel="noopener noreferrer">
                    <div className="list-item-icon">
                      {/* YouTube SVG */}
                      <svg width="24" height="17" viewBox="0 0 24 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.54545 11.9817V4.86931L15.8182 8.4257L9.54545 11.9817ZM23.4985 2.63135C23.2225 1.59555 22.4092 0.779906 21.3766 0.503086C19.505 2.67029e-07 12 0 12 0C12 0 4.495 2.67029e-07 2.62335 0.503086C1.59076 0.779906 0.777485 1.59555 0.501509 2.63135C0 4.50865 0 8.42553 0 8.42553C0 8.42553 0 12.3424 0.501509 14.2197C0.777485 15.2555 1.59076 16.0712 2.62335 16.3481C4.495 16.8511 12 16.8511 12 16.8511C12 16.8511 19.505 16.8511 21.3766 16.3481C22.4092 16.0712 23.2225 15.2555 23.4985 14.2197C24 12.3424 24 8.42553 24 8.42553C24 8.42553 24 4.50865 23.4985 2.63135Z" fill="var(--accent)"/>
                      </svg>
                    </div>
                    <div className="list-item-content">
                      <div className="body-text">YouTube</div>
                      <div className="information-wrapper">
                        <div className="information">thatjoshguy08</div>
                      </div>
                    </div>
                    <div className="list-item-chevron">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="Shape">
                          <path id="Vector 3" d="M8.80005 20L15.3858 13.4142C16.1669 12.6332 16.1669 11.3668 15.3858 10.5858L8.80005 4" stroke="#ACACB1" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                  </a>
                  <ContactLink href="https://t.me/ThatJoshGuy" label="Telegram" detail="@ThatJoshGuy" icon={Telegram} />
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
