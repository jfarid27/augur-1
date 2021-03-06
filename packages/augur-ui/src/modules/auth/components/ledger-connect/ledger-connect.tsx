import React, { Component } from "react";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Eth from "@ledgerhq/hw-app-eth";

import DerivationPath, {
  NUM_DERIVATION_PATHS_TO_DISPLAY
} from "modules/auth/helpers/derivation-path";
import HardwareWallet from "modules/auth/components/common/hardware-wallet";

interface LedgerProps {
  loginWithLedger: Function;
  showAdvanced: boolean
  showError: Function;
  hideError: Function;
  error: boolean
  setIsLoading: Function;
  setShowAdvancedButton: Function;
  logout: Function;
  isClicked: boolean
  isLoading: boolean;
}

export default class Ledger extends Component<LedgerProps> {
  static ledgerValidation() {
    if (location.protocol !== "https:") {
      return false;
    }
    return true;
  }

  static async onDerivationPathChange(derivationPaths, pageNumber = 1) {
    const transport = await TransportU2F.create();
    const ledgerEthereum = new Eth(transport);
    const appConfiguration = await ledgerEthereum.getAppConfiguration();
    if (!appConfiguration.arbitraryDataEnabled) {
      // value is 0 if contract data is turned off, 1 if contract data is turned
      console.log("Ledger does not have contract data enabled");
      return { success: false };
    }
    const addresses = [];

    for (const derivationPath of derivationPaths) {
      const components = DerivationPath.parse(derivationPath);
      const numberOfAddresses = NUM_DERIVATION_PATHS_TO_DISPLAY * pageNumber;
      const indexes = Array.from(Array(numberOfAddresses).keys());
      for (const index of indexes) {
        const derivationPath = DerivationPath.buildString(
          DerivationPath.increment(components, index)
        );
        // ledger can only take one request at a time, can't stack up promises
        const result = await ledgerEthereum
          .getAddress(derivationPath, false, true)
          .catch(err => {
            console.log("Error:", err);
            return { success: false };
          });
        addresses.push(result && { address: result.address, derivationPath });
      }
    }

    if (addresses && addresses.length > 0) {
      if (!addresses.every(element => !element.address)) {
        return { success: true, addresses };
      }
    }

    return { success: false };
  }

  constructor(props) {
    super(props);

    this.connectWallet = this.connectWallet.bind(this);
  }

  async connectWallet(derivationPath) {
    const { loginWithLedger, logout } = this.props;
    const transport = await TransportU2F.create();

    transport.on("disconnect", () => {
      console.log("Ledger is disconected");
      logout();
    });

    const ledgerEthereum = new Eth(transport);
    const result = await ledgerEthereum.getAddress(derivationPath);
    const { address } = result;

    if (address) {
      return loginWithLedger(
        address.toLowerCase(),
        ledgerEthereum,
        derivationPath
      );
    }
  }

  render() {
    return (
      <HardwareWallet
        loginWithWallet={this.connectWallet}
        walletName="ledger"
        onDerivationPathChange={Ledger.onDerivationPathChange}
        validation={Ledger.ledgerValidation}
        {...this.props}
      />
    );
  }
}
