"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: "metamask" | "walletconnect") => void;
  isConnecting: boolean;
}

export function WalletModal({ isOpen, onClose, onConnect, isConnecting }: WalletModalProps) {
  const isMobile = typeof window !== "undefined" && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {/* MetaMask */}
          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3 text-left bg-transparent"
            onClick={() => onConnect("metamask")}
            disabled={isConnecting}
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
              alt="MetaMask" 
              className="w-8 h-8"
            />
            <div className="flex-1">
              <div className="font-medium">MetaMask</div>
              <div className="text-xs text-muted-foreground">
                {isMobile && !hasMetaMask ? "Open in MetaMask app" : "Connect with MetaMask"}
              </div>
            </div>
            {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>

          {/* Coinbase Wallet */}
          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3 text-left bg-transparent"
            onClick={() => {
              if (isMobile) {
                window.location.href = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`;
              } else {
                window.open("https://www.coinbase.com/wallet", "_blank");
              }
            }}
            disabled={isConnecting}
          >
            <img 
              src="https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-wallet-logo.png" 
              alt="Coinbase Wallet" 
              className="w-8 h-8 rounded-lg"
            />
            <div className="flex-1">
              <div className="font-medium">Coinbase Wallet</div>
              <div className="text-xs text-muted-foreground">
                {isMobile ? "Open in Coinbase app" : "Connect with Coinbase"}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Trust Wallet */}
          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3 text-left bg-transparent"
            onClick={() => {
              if (isMobile) {
                window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`;
              } else {
                window.open("https://trustwallet.com/", "_blank");
              }
            }}
            disabled={isConnecting}
          >
            <img 
              src="https://trustwallet.com/assets/images/media/assets/TWT.png" 
              alt="Trust Wallet" 
              className="w-8 h-8 rounded-lg"
            />
            <div className="flex-1">
              <div className="font-medium">Trust Wallet</div>
              <div className="text-xs text-muted-foreground">
                {isMobile ? "Open in Trust Wallet app" : "Connect with Trust Wallet"}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By connecting, you agree to the Terms of Service
        </p>
      </DialogContent>
    </Dialog>
  );
}
