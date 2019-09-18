// randomChoice chooses <num> items randomly from <list>
const randomChoice = (list, num) => (
  list
    .sort(() => 0.5 - Math.random())
    .slice(0, num || list.length)
);

export default randomChoice;
