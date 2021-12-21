import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO, BIG_INT_ONE_DAY_SECONDS, VAULT_MANAGER_ADDRESS } from "const";
import { CDP, CDPHistory } from "../../generated/schema";
import { ERC20 } from '../../generated/VaultManager/ERC20';

export function getCDP(collateral: Address): CDP {
    let cdp = CDP.load(collateral.toHex())
    
    if (cdp === null) {
        cdp = new CDP(collateral.toHex())
        cdp.vaultManager = VAULT_MANAGER_ADDRESS.toHex()
        cdp.lfr = BIG_DECIMAL_ZERO
        cdp.sfr = BIG_DECIMAL_ZERO
        cdp.mcr = BIG_DECIMAL_ZERO
        cdp.decimals = BIG_DECIMAL_ZERO
    }

    cdp.save()

    if (cdp.decimals.equals(BIG_DECIMAL_ZERO)) {
        return getCDPWithDecimals(collateral)
    } else {
        return cdp as CDP
    }
}

export function createCDPHistory(collateral: Address, block: ethereum.Block): CDPHistory {
    const date = block.timestamp.div(BIG_INT_ONE_DAY_SECONDS)
    const cdp = CDP.load(collateral.toHex())
    const id = cdp.id.concat('-').concat(block.timestamp.toString())

    let history = CDPHistory.load(id)

    if (history === null) {
        history = new CDPHistory(id)

        history.date = date

        history.vaultManager = cdp.vaultManager
        history.lfr = cdp.lfr
        history.sfr = cdp.sfr
        history.mcr = cdp.mcr
        history.decimals = cdp.decimals
    }

    history.block = block.number
    history.timestamp = block.timestamp

    history.save()
    return history as CDPHistory
}

export function getCDPWithDecimals(collateral:Address): CDP {
    let cdp = CDP.load(collateral.toHex())

    const contract = ERC20.bind(collateral)
    const decimals = contract.try_decimals()
    if (!decimals.reverted){
        cdp.decimals = BigDecimal.fromString('1'.concat('0'.repeat(decimals.value)))
    }

    cdp.save()

    return cdp as CDP
}