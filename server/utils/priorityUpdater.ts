import chalk from "chalk";

import { Provider } from "./types";

export default function priorityUpdater(
  listToUpdate: Provider[],
  newPriorities: Provider[]
) {
  listToUpdate = [...newPriorities];
  for (const [index, provider] of listToUpdate.entries()) {
    console.log(
      chalk.bgYellowBright.black(`UPDATE:`),
      `PRIORITY-${index}`,
      provider.provider_name
    );
  }
}
