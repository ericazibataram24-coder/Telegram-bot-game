import React from 'react';
import { Facebook, Linkedin, Youtube, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Eric Azibataram</h2>
            <p className="text-sm text-gray-400">Ideas worth publishing</p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              FOLLOW & SUPPORT
            </h3>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/share/1FMjfU7GX9/" target="_blank" rel="noopener noreferrer" className="p-2.5 text-gray-400 hover:text-white rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/eric-azibataram-3168012b0" target="_blank" rel="noopener noreferrer" className="p-2.5 text-gray-400 hover:text-white rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@Ericnaijagist" target="_blank" rel="noopener noreferrer" className="p-2.5 text-gray-400 hover:text-white rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all" aria-label="YouTube Channel">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="mailto:Ericazibataram24@gmail.com?subject=Support%20Inquiry" className="p-2.5 text-gray-400 hover:text-white rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all" aria-label="Customer Support Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800/60 pt-8 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Eric Azibataram. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
