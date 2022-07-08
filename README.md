# OpenGSN Testing Example
Simple example using the OpenGSN CatptureTheFlag contract and OpenGSNTestEnvironment.

## TLDR;
```
git clone git@github.com:owlprotocol/opengsn-testing-example.git
pnpm i
npm run ganache
npm run test
```

## Testing
OpenGSN relies on having a connection to an RPC node so our test process is a little differnet that simply running `hh test` with Hardhat. Instead we follow these steps to start a server manually and then run our tests.
* `npm run ganache`: Runs a hardhat node on `http://localhost:8545`
* `npm run test`: Runs `hardhat test --network ganache`