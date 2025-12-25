import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Social Icons
const FacebookIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.0006 11.6396C15.3836 11.6396 11.6406 15.3826 11.6406 19.9996C11.6406 24.191 14.7281 27.6517 18.7512 28.2563V22.2154H16.6828V20.0179H18.7512V18.5556C18.7512 16.1347 19.9307 15.0718 21.9428 15.0718C22.9065 15.0718 23.4161 15.1432 23.6574 15.1759V17.0942H22.2848C21.4306 17.0942 21.1323 17.9039 21.1323 18.8167V20.0179H23.6357L23.296 22.2154H21.1323V28.2741C25.2127 27.7205 28.3606 24.2317 28.3606 19.9996C28.3606 15.3826 24.6176 11.6396 20.0006 11.6396Z" fill="currentColor"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_764_1706)">
      <path d="M20 12.2107C22.5383 12.2107 22.8389 12.2219 23.8371 12.2664C24.7648 12.3072 25.2658 12.4631 25.5998 12.593C26.0414 12.7637 26.3605 12.9715 26.6908 13.3018C27.0248 13.6357 27.2289 13.9512 27.3996 14.3928C27.5295 14.7268 27.6854 15.2314 27.7262 16.1555C27.7707 17.1574 27.7818 17.458 27.7818 19.9926C27.7818 22.5309 27.7707 22.8314 27.7262 23.8297C27.6854 24.7574 27.5295 25.2584 27.3996 25.5924C27.2289 26.034 27.0211 26.3531 26.6908 26.6834C26.3568 27.0174 26.0414 27.2215 25.5998 27.3922C25.2658 27.5221 24.7611 27.6779 23.8371 27.7188C22.8352 27.7633 22.5346 27.7744 20 27.7744C17.4617 27.7744 17.1611 27.7633 16.1629 27.7188C15.2352 27.6779 14.7342 27.5221 14.4002 27.3922C13.9586 27.2215 13.6395 27.0137 13.3092 26.6834C12.9752 26.3494 12.7711 26.034 12.6004 25.5924C12.4705 25.2584 12.3146 24.7537 12.2738 23.8297C12.2293 22.8277 12.2182 22.5271 12.2182 19.9926C12.2182 17.4543 12.2293 17.1537 12.2738 16.1555C12.3146 15.2277 12.4705 14.7268 12.6004 14.3928C12.7711 13.9512 12.9789 13.632 13.3092 13.3018C13.6432 12.9678 13.9586 12.7637 14.4002 12.593C14.7342 12.4631 15.2389 12.3072 16.1629 12.2664C17.1611 12.2219 17.4617 12.2107 20 12.2107ZM20 10.5C17.4209 10.5 17.098 10.5111 16.085 10.5557C15.0756 10.6002 14.3816 10.7635 13.7805 10.9973C13.1533 11.2422 12.6227 11.565 12.0957 12.0957C11.565 12.6227 11.2422 13.1533 10.9973 13.7768C10.7635 14.3816 10.6002 15.0719 10.5557 16.0812C10.5111 17.098 10.5 17.4209 10.5 20C10.5 22.5791 10.5111 22.902 10.5557 23.915C10.6002 24.9244 10.7635 25.6184 10.9973 26.2195C11.2422 26.8467 11.565 27.3773 12.0957 27.9043C12.6227 28.4312 13.1533 28.7578 13.7768 28.999C14.3816 29.2328 15.0719 29.3961 16.0813 29.4406C17.0943 29.4852 17.4172 29.4963 19.9963 29.4963C22.5754 29.4963 22.8982 29.4852 23.9113 29.4406C24.9207 29.3961 25.6147 29.2328 26.2158 28.999C26.8393 28.7578 27.3699 28.4312 27.8969 27.9043C28.4238 27.3773 28.7504 26.8467 28.9916 26.2232C29.2254 25.6184 29.3887 24.9281 29.4332 23.9188C29.4777 22.9057 29.4889 22.5828 29.4889 20.0037C29.4889 17.4246 29.4777 17.1018 29.4332 16.0887C29.3887 15.0793 29.2254 14.3854 28.9916 13.7842C28.7578 13.1533 28.435 12.6227 27.9043 12.0957C27.3773 11.5688 26.8467 11.2422 26.2232 11.001C25.6184 10.7672 24.9281 10.6039 23.9188 10.5594C22.902 10.5111 22.5791 10.5 20 10.5Z" fill="currentColor"/>
      <path d="M20 15.1201C17.3059 15.1201 15.1201 17.3059 15.1201 20C15.1201 22.6941 17.3059 24.8799 20 24.8799C22.6941 24.8799 24.8799 22.6941 24.8799 20C24.8799 17.3059 22.6941 15.1201 20 15.1201ZM20 23.1654C18.2521 23.1654 16.8346 21.7479 16.8346 20C16.8346 18.2521 18.2521 16.8346 20 16.8346C21.7479 16.8346 23.1654 18.2521 23.1654 20C23.1654 21.7479 21.7479 23.1654 20 23.1654Z" fill="currentColor"/>
      <path d="M26.2121 14.9271C26.2121 15.558 25.7 16.0664 25.0729 16.0664C24.442 16.0664 23.9336 15.5543 23.9336 14.9271C23.9336 14.2962 24.4457 13.7878 25.0729 13.7878C25.7 13.7878 26.2121 14.3 26.2121 14.9271Z" fill="currentColor"/>
    </g>
    <defs>
      <clipPath id="clip0_764_1706">
        <rect width="19" height="19" fill="white" transform="translate(10.5 10.5)"/>
      </clipPath>
    </defs>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.9596 15.8006C27.8002 14.9209 27.0408 14.2803 26.1596 14.0803C24.8408 13.8006 22.4002 13.6006 19.7596 13.6006C17.1205 13.6006 14.6408 13.8006 13.3205 14.0803C12.4408 14.2803 11.6799 14.8803 11.5205 15.8006C11.3596 16.8006 11.2002 18.2006 11.2002 20.0006C11.2002 21.8006 11.3596 23.2006 11.5596 24.2006C11.7205 25.0803 12.4799 25.7209 13.3596 25.9209C14.7596 26.2006 17.1596 26.4006 19.8002 26.4006C22.4408 26.4006 24.8408 26.2006 26.2408 25.9209C27.1205 25.7209 27.8799 25.1209 28.0408 24.2006C28.2002 23.2006 28.4002 21.76 28.4408 20.0006C28.3596 18.2006 28.1596 16.8006 27.9596 15.8006ZM17.6002 22.8006V17.2006L22.4799 20.0006L17.6002 22.8006Z" fill="currentColor"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-purple-900 to-indigo-900 text-white py-12 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Logo - Centered at top */}
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Image
                src="/images/white-logo.svg"
                alt="UniCash Logo"
                width={150}
                height={26}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Navigation Links - Two Columns */}
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            {/* Left Column */}
            <div>
              <ul className="space-y-2">
                <li>
                  <Link href="/giveaways" className="text-white/80 hover:text-white transition text-sm">
                    Giveaways
                  </Link>
                </li>
                <li>
                  <Link href="/winners" className="text-white/80 hover:text-white transition text-sm">
                    Winners
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-white/80 hover:text-white transition text-sm">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/80 hover:text-white transition text-sm">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-white/80 hover:text-white transition text-sm">
                    About us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Right Column */}
            <div>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-white/80 hover:text-white transition text-sm">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/80 hover:text-white transition text-sm">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
              
              {/* Social Media Icons - Below Privacy Policy */}
              <div className="flex space-x-3 mt-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                  <FacebookIcon />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                  <InstagramIcon />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                  <YouTubeIcon />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright - Centered at bottom */}
          <div className="text-center">
            <p className="text-white/60 text-xs">© 2025 UNICASH. All rights reserved.</p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-start justify-between max-w-5xl mx-auto">
            {/* Logo - Left Side */}
            <div className="flex-shrink-0">
              <Link href="/">
                <Image
                  src="/images/white-logo.svg"
                  alt="UniCash Logo"
                  width={150}
                  height={26}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Navigation Links - Center */}
            <div className="flex-1 flex justify-center">
              <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                {/* Left Column */}
                <div>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/giveaways" className="text-white/80 hover:text-white transition text-base">
                        Giveaways
                      </Link>
                    </li>
                    <li>
                      <Link href="/winners" className="text-white/80 hover:text-white transition text-base">
                        Winners
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="text-white/80 hover:text-white transition text-base">
                        FAQs
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-white/80 hover:text-white transition text-base">
                        Contact Support
                      </Link>
                    </li>
                    <li>
                      <Link href="/about" className="text-white/80 hover:text-white transition text-base">
                        About us
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Right Column */}
                <div>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/terms" className="text-white/80 hover:text-white transition text-base">
                        Terms & Conditions
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="text-white/80 hover:text-white transition text-base">
                        Privacy Policy
                      </Link>
                    </li>
                  </ul>
                  
                  {/* Social Media Icons - Below Privacy Policy */}
                  <div className="flex space-x-3 mt-6">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                      <FacebookIcon />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                      <InstagramIcon />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                      <YouTubeIcon />
                    </a>
                  </div>
                  
                  {/* Copyright - Below Social Icons */}
                  <div className="mt-4">
                    <p className="text-white/60 text-sm">© 2025 UNICASH. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

