import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import logo from "./logo.svg";
import "./App.css";

/*some easy conversion functions */
function monthStringUS(dateString) {
  var d = new Date(dateString);
  return (d.getMonth() + 1 + "").padStart(2, "0") + "/01/" + d.getFullYear();
}

function convertToPoints(inputNumber) {
  if (inputNumber < 51) return 0;
  else
    return inputNumber > 100
      ? Math.floor(50 + 2 * (inputNumber - 100))
      : Math.floor(inputNumber - 50);
}

function pointMsg(inputVal) {
  var points = convertToPoints(parseFloat(inputVal));
  if (points === 1) return "1 point";
  else return points + " points";
}

/* main app */
function App() {
  const [currentPrice, setPrice] = useState(0);
  const [currentDate, setDate] = useState(new Date());
  const [list, setList] = useState([]);
  const [currentSum, setSum] = useState(0);
  const [currentTotal, setTotal] = useState(0);
  const [months, setMonths] = useState({});
  useEffect(() => {
    // Supposedly should run?
  });
  function batchAdd(text)
  {
    var nextSum = currentSum;
    var nextTotal = currentTotal;
    var strikes=0;
    var newList = [...list];
    var copy = { ...months };
    var line;
    const lines = text.split("\n");
    for (line of lines) {
      if (line.length > 2){ 
        var data = line.split(",");
        if ((data.length < 2))
        {
          alert("Invalid file; needs to have comma-separated values on each line!")
          return;
        }
        if (!data[0].toLowerCase().includes("date")){
          if (isNaN(Date.parse(data[0]))) {
            /*column two invalid*/
            alert("Invalid date found: "+data[0]);
            strikes = strikes + 1;
          }
          else if (isNaN(parseFloat(data[1]))){
            /*column two invalid*/
            alert("Invalid price found: "+data[1]);
            strikes = strikes + 1;
          }
          else{
            /*successful!*/
            var cash = parseFloat(data[1]);
            var pointsAdded =  convertToPoints(cash);
            newList = [
              ...newList,
              {
                id: newList.length,
                price: cash,
                date: monthStringUS(Date.parse(data[0])),
              },
            ];
            nextSum = nextSum + cash;
            nextTotal = nextTotal + pointsAdded;
            var theFirst = monthStringUS(data[0]);
            if (!Object.keys(copy).includes(theFirst)) {
              copy[theFirst] = {
                dollars: cash,
                points: pointsAdded,
              };
            } else {
              copy[theFirst]["dollars"] =
                parseFloat(copy[theFirst]["dollars"]) + cash;
              copy[theFirst]["points"] =
                parseInt(copy[theFirst]["points"]) + pointsAdded;
            }
          }
          if (strikes > 2){
            alert("Cancelling upload.  Please try again with a valid file.");
            return;
          }
        }
        else{
          console.log("Blank line skipped");
        }
      }
    };
    
    console.log(newList);
    setList(newList);
    setMonths(copy);
    setTotal(nextTotal);
    setSum(nextSum);
    document.getElementById("csv-file").value="";
    return newList;
  }
  function monthCheck(date,price) {
    var copy = { ...months };
    var theFirst = monthStringUS(date);
    var pointsAdded = convertToPoints(price);
    if (!Object.keys(copy).includes(theFirst)) {
      copy[theFirst] = {
        dollars: price,
        points: pointsAdded,
      };
    } else {
      copy[theFirst]["dollars"] =
        parseFloat(copy[theFirst]["dollars"]) + price;
      copy[theFirst]["points"] =
        parseInt(copy[theFirst]["points"]) + pointsAdded;
    }
    setMonths(copy);
  }
  function addItem(date,price){
    console.log("Adding: "+date+", "+price);
    console.log("Was: "+list);
    let newList = [
      ...list,
      {
        id: list.length,
        price: price,
        date: monthStringUS(date),
      },
    ];
    console.log(newList);
    setList(newList);
    console.log("async test: "+list);
    setSum(currentSum + parseFloat(price));
    setTotal(currentTotal + convertToPoints(parseFloat(price)));
    monthCheck(date,price);
    return newList;
  }
  function handleAdd() {
    addItem(currentDate,currentPrice);
  }
  function clearAll() {
    setPrice(0);
    setDate(new Date());
    setMonths({});
    setList([]);
    setSum(0);
    setTotal(0);
  }
  /*function setListSynchronous(listUpdate) {//to prevent issues from async
        return new Promise(resolve => {
            setList(listUpdate, () => resolve());
        });
    }*/
  async function readFile(e) {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => { 
      const text = (e.target.result);
      return batchAdd(text);
    };
    reader.readAsText(e.target.files[0]);
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>
          <code>React</code> Rewards Calculator
        </h1>
        <form>
          <div id="newItem">
            <label>Price (USD): </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentPrice}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
            <label>Transaction Date: </label>
            <DatePicker selected={currentDate} onChange={(d) => setDate(d)} />
            <input type="button" onClick={handleAdd} value="Add" />
          </div>
          <br />
          <label>This transaction is eligible for: </label>
          <input
            type="text"
            value={pointMsg(currentPrice) + "!"}
            id="rewards"
            readOnly
          />
          <br/>
          <hr/>
          <p id="csv-descript">You may upload a .CSV file for faster tabulation.  Make sure your file has dates in the first column (before the comma) and dollar amounts in the second.</p>
          <input id="csv-file" type="file" onChange={(e) => readFile(e)} />
          <br/>
          <br/>
          <button onClick={clearAll} >Clear All</button>
        </form>
        <br />
        <div id="summary">
          <hr/>
          <h3>Rewards Summary</h3>
          <table>
            <tbody>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Total Spent</th>
                <th scope="col">Points Earned</th>
              </tr>
              {Object.keys(months)
                .sort(function (a, b) {
                  var aa = a.split("/").reverse().join(),
                    bb = b.split("/").reverse().join();
                  return aa < bb ? -1 : aa > bb ? 1 : 0;
                })
                .map((item, i) => (
                  <tr key={i}>
                    <td>{item}</td>
                    <td>${parseFloat(months[item].dollars).toFixed(2)}</td>
                    <td>{months[item].points} point(s)</td>
                  </tr>
                ))}
              {list.length > 0 ? (
                <tr>
                  <th scope="row">All</th>
                  <td>${parseFloat(currentSum).toFixed(2)}</td>
                  <td>{currentTotal} points</td>
                </tr>
              ) : (<tr/>
              )}
            </tbody>
          </table>
        </div>
        <br />
        <div id="history">
          <hr/>
          <h3>Purchase History</h3>
          <table>
            <tbody>
              <tr>
                <th scope="col">Transaction #</th>
                <th scope="col">Date</th>
                <th scope="col">Price</th>
                <th scope="col">Rewards</th>
              </tr>
              {list.map((item) => (
                <tr key={item.id.toString()}>
                  <th scope="row">{item.id + 1}</th>
                  <td>{item.date}</td>
                  <td>${parseFloat(item.price).toFixed(2)}</td>
                  <td>{pointMsg(item.price)}</td>
                </tr>
              ))}

              {list.length > 0 ? (
                <tr>
                  <th scope="row">TOTAL</th>
                  <td>-</td>
                  <td>${parseFloat(currentSum).toFixed(2)}</td>
                  <td>{currentTotal} points</td>
                </tr>
              ) : (
                <tr>
                  <th scope="row">TOTAL</th>
                  <td>-</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </header>
    </div>
  );
}

export default App;
