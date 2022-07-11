// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.6.9;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

/**
 * @dev A simple minimal Proof-of-Concept contract using GSN
 */
contract CaptureTheFlag is BaseRelayRecipient {
    event FlagCaptured(address _from, address _to);

    address public flagHolder = address(0);

    function setTrustedForwarder(address _trustedForwarder) public {
        _setTrustedForwarder(_trustedForwarder);
    }

    function versionRecipient() public pure override returns (string memory) {
        return "2.2.1";
    }

    function captureFlag() external {
        address previous = flagHolder;

        // The real sender. If you are using GSN, this
        // is not the same as msg.sender.
        flagHolder = _msgSender();

        emit FlagCaptured(previous, flagHolder);
    }
}
