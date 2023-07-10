import dorita980 from 'dorita980';
import find from 'local-devices';
import fs from 'fs';

const roobyLocal = new dorita980.Local(
  process.env.ROOMBA_USERID,
  process.env.ROOMBA_PASSWORD,
  process.env.ROOMBA_IP,
);

const discoverDevices = async () => {
  const devices = await find();
  return devices;
};

const isCleaning: () => Promise<boolean> = async () => {
  const state = await roobyLocal.getMission();
  return state.cleanMissionStatus.phase === 'run';
};

const init = async () => {
  console.log('Connected to Rooby!');

  const cleaning = await isCleaning();
  console.log('Cleaning: ', cleaning);

  if (cleaning) {
    console.log('Rooby is cleaning. Exit.');
    return;
  }

  console.log('Discovering devices...');
  const devices = await discoverDevices();

  if (devices.length > +process.env.NUMBER_OF_DEVICES_WHEN_EMPTY) {
    // People are home. Delete the clean-session-started.txt file.
    if (fs.existsSync('clean-session-started.txt')) {
      fs.unlinkSync('clean-session-started.txt');
    }

    // Write to a file that people are home.
    console.log('People are home. Exit.');
    return;
  }

  // If clean session has already started then exit.
  if (fs.existsSync('clean-session-started.txt')) {
    console.log('Clean session has already started. Exit.');
    return;
  }

  // No one at home. Start cleaning.
  console.log('No one at home. Start cleaning.');
  const state = await roobyLocal.start();

  // Write to file that Rooby is cleaning session has started.
  fs.writeFileSync('clean-session-started.txt', 'true');
  console.log('Clean session has started.');
};

roobyLocal.on('connect', () => {
  init().then(() => {
    // End connection.
    roobyLocal.end();
    process.exit(0);
  });
});
