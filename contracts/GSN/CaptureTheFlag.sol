// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.6.0;

import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "@opengsn/gsn/contracts/interfaces/IKnowForwarderAddress.sol";

/**
 * @dev A simple minimal Proof-of-Concept contract using GSN
 */
contract CaptureTheFlag is BaseRelayRecipient, IKnowForwarderAddress {
    event FlagCaptured(address _from, address _to);

    address public flagHolder = address(0);

    function setTrustedForwarder(address _trustedForwarder) public {
        trustedForwarder = _trustedForwarder;
    }

    function getTrustedForwarder() public view override returns (address) {
        return trustedForwarder;
    }

    function versionRecipient() external view override returns (string memory) {
        return "2.0.0";
    }

    function captureFlag() external {
        address previous = flagHolder;

        // The real sender. If you are using GSN, this
        // is not the same as msg.sender.
        flagHolder = _msgSender();

        emit FlagCaptured(previous, flagHolder);
    }
}
