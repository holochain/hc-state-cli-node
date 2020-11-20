import {  } from "./utils"

const main = async () => {
    const argv = process.argv;

    console.log(argv);
}

main()
    .then(()=> process.exit())
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
