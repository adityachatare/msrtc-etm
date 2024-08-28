import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Import react-select
import './DynamicTextBoxRow.css'; // Import the custom CSS

function DynamicTextBoxRow() {
  const [rows, setRows] = useState([['', '', '', '', '']]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [depots, setDepots] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [selectedBusType, setSelectedBusType] = useState(null);
  const [seatsOptions, setSeatsOptions] = useState([]);
  
  // For operating days
  const [operatingDays, setOperatingDays] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });

  // Updated placeholders with "Scheduled Time"
  const placeholders = [
    'Stage No',
    'Stop Name',
    'Stop Name Marathi',
    'Kms From Source',
    'Kms From Destination'
  ];

  const topPlaceholders = [
    'Route No.',
    'Operating Depot',
    'Bus Type',
    'No of Seats',
    'Route Name',
    'Source En',
    'Source Mr',
    'Destination En',
    'Destination Mr',
    'Scheduled Time'  // New field
  ];

  const [topInputs, setTopInputs] = useState(new Array(topPlaceholders.length).fill(''));

  useEffect(() => {
    const fetchDepots = async () => {
      try {
        const response = await fetch('https://9da6x7eoj8.execute-api.ap-south-1.amazonaws.com/Dev/get/MSRTC-Lookup/Depots');
        const data = await response.json();
        if (data && data.Depots) {
          const depotOptions = data.Depots.map(depot => ({
            value: depot.Code,
            label: `${depot.Code} - ${depot.Name}`
          }));
          setDepots(depotOptions);
        }
      } catch (error) {
        console.error('Error fetching depots:', error);
      }
    };

    const fetchBusTypes = async () => {
      try {
        const response = await fetch('https://9da6x7eoj8.execute-api.ap-south-1.amazonaws.com/Dev/get/MSRTC-Lookup/BusTypes');
        const data = await response.json();
        if (data && data.BusTypes) {
          const busTypeOptions = data.BusTypes.map(bus => ({
            value: bus.Name,
            label: bus.Name,
            noOfSeats: bus.NoOfSeats
          }));
          setBusTypes(busTypeOptions);
        }
      } catch (error) {
        console.error('Error fetching bus types:', error);
      }
    };

    fetchDepots();
    fetchBusTypes();
  }, []);

  const handleTopInputChange = (e, index) => {
    const updatedInputs = [...topInputs];
    updatedInputs[index] = e.target.value;
    setTopInputs(updatedInputs);
  };

  const handleAddRow = () => {
    setRows([...rows, ['', '', '', '', '']]);
  };

  const handleDeleteRow = (rowIndex) => {
    const updatedRows = rows.filter((_, index) => index !== rowIndex);
    setRows(updatedRows);
  };

  const handleChange = (e, rowIndex, colIndex) => {
    const updatedRows = rows.map((row, i) =>
      i === rowIndex ? row.map((col, j) => (j === colIndex ? e.target.value : col)) : row
    );
    setRows(updatedRows);
  };

  const handleDepotChange = (selectedOption) => {
    setSelectedDepot(selectedOption);
  };

  const handleBusTypeChange = (selectedOption) => {
    setSelectedBusType(selectedOption);
    setSeatsOptions(selectedOption ? [{ value: selectedOption.noOfSeats, label: selectedOption.noOfSeats }] : []);
  };

  const handleOperatingDayChange = (e) => {
    setOperatingDays({
      ...operatingDays,
      [e.target.name]: e.target.checked
    });
  };

  const getJsonData = () => {
    const [
      routeNo,
      ,
      ,
      ,
      routeName,
      sourceEn,
      sourceMr,
      destinationEn,
      destinationMr,
      scheduledTime
    ] = topInputs;

    const jsonData = {
      PK: `Depot-${selectedDepot ? selectedDepot.value : ''}-${routeNo}-Metadata`,
      SK: `${selectedDepot ? selectedDepot.value : ''}-${routeNo}-Metadata`,
      RouteNo: topInputs[0],
      OperatingDepot: selectedDepot ? selectedDepot.value : '',
      BusType: selectedBusType ? selectedBusType.value : '',
      NoOfSeats: selectedBusType ? selectedBusType.noOfSeats : '',
      RouteName: topInputs[4],
      SourceEn: topInputs[5],
      SourceMr: topInputs[6],
      DestinationEn: topInputs[7],
      DestinationMr: topInputs[8],
      ScheduledTime: scheduledTime, // Include Scheduled Time
      OperatingDays: operatingDays,
      Stages: rows.map(row => ({
        StageNo: row[0],
        StopName: row[1],
        StopNameMarathi: row[2],
        KmsFromSource: row[3],
        KmsFromDestination: row[4],
      }))
    };

    console.log(jsonData);
    return jsonData;
  };

  const postJsonData = async () => {
    setLoading(true); // Start loader
    const jsonData = getJsonData();

    try {
      const response = await fetch('https://9da6x7eoj8.execute-api.ap-south-1.amazonaws.com/Dev/AddRouteWeb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',  // Use 'no-cors' to bypass CORS policy
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
      }

      const resultText = await response.text();
      if (resultText) {
        const result = JSON.parse(resultText);
        console.log('Success:', result);
      } else {
        console.log('Success: No content in the response.');
      }

      setShowSuccessModal(true); // Show success modal
    } catch (error) {
      console.error('Fetch Error:', error.message);
      alert('Failed to post data due to network error or CORS issue!');
    } finally {
      setLoading(false); // Stop loader
      resetForm(); // Clear all text boxes
    }
  };

  const resetForm = () => {
    setTopInputs(new Array(topPlaceholders.length).fill(''));
    setRows([['', '', '', '', '']]);
    setSelectedDepot(null); // Clear selected depot
    setSelectedBusType(null); // Clear selected bus type
    setSeatsOptions([]); // Clear seats options
    setOperatingDays({
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false,
    }); // Clear operating days
  };

  const handleCloseModal = () => setShowSuccessModal(false);

  const navigate = useNavigate();
  
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Fixed Sidebar */}
        <div className="col-md-3 col-lg-2 sidebar">
          <div className="sidebar-header">
            <h4>Navigation</h4>
          </div>
          <div className="sidebar-body">
            <Button variant="link" onClick={() => handleNavigate('/bus-type')}>
              Bus Type
            </Button>
            {/* Add more navigation items here if needed */}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10 content">
          {/* Loader */}
          {loading && (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {/* Top Individual Text Boxes */}
          <div className="row mb-4">
            {topPlaceholders.map((placeholder, index) => (
              <div className="col-md-4 mb-3" key={index}>
                <label className="form-label">{placeholder}</label>
                {index === 1 ? ( // Replace Operating Depot with searchable dropdown
                  <Select
                    options={depots}
                    value={selectedDepot}
                    onChange={handleDepotChange}
                    placeholder="Select Depot"
                    className="basic-single"
                    classNamePrefix="select"
                  />
                ) : index === 2 ? ( // Replace Bus Type with searchable dropdown
                  <Select
                    options={busTypes}
                    value={selectedBusType}
                    onChange={handleBusTypeChange}
                    placeholder="Select Bus Type"
                    className="basic-single"
                    classNamePrefix="select"
                  />
                ) : index === 3 ? ( // Replace No Of Seats with dropdown
                  <Select
                    options={seatsOptions}
                    value={seatsOptions[0]}
                    isDisabled
                    placeholder="No Of Seats"
                    className="basic-single"
                    classNamePrefix="select"
                  />
                ) : (
                  <input
                    type={index === 9 ? 'time' : 'text'} // Scheduled Time field uses time input type
                    className="form-control"
                    placeholder={placeholder}
                    value={topInputs[index]}
                    onChange={(e) => handleTopInputChange(e, index)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Operating Days Checkboxes */}
          <div className="mb-4">
            <label className="form-label">Operating Days</label>
            <div className="d-flex flex-wrap">
              {Object.keys(operatingDays).map(day => (
                <div key={day} className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={day}
                    name={day}
                    checked={operatingDays[day]}
                    onChange={handleOperatingDayChange}
                  />
                  <label className="form-check-label" htmlFor={day}>
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Rows of Text Boxes */}
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  {placeholders.map((placeholder, index) => (
                    <th key={index}>{placeholder}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((col, colIndex) => (
                      <td key={colIndex}>
                        <input
                          type="text"
                          className="form-control"
                          value={col}
                          placeholder={placeholders[colIndex]}
                          onChange={(e) => handleChange(e, rowIndex, colIndex)}
                        />
                      </td>
                    ))}
                    <td>
                      <Button variant="danger" onClick={() => handleDeleteRow(rowIndex)}>
                        Delete Stage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Horizontal Buttons */}
          <div className="row mt-3">
            <div className="col-auto">
              <Button variant="primary" onClick={handleAddRow}>
                Add Stage
              </Button>
            </div>
            <div className="col-auto">
              <Button variant="success" onClick={postJsonData} disabled={loading}>
                Submit
              </Button>
            </div>
          </div>

          {/* Success Modal */}
          <Modal show={showSuccessModal} onHide={handleCloseModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>Success</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  fill="green"
                  className="bi bi-check-circle-fill mb-3"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.707 10.293l4-4a1 1 0 0 0-1.414-1.414L6 7.586 4.707 6.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0z" />
                </svg>
                <h4>Data Submitted Successfully!</h4>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="success" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default DynamicTextBoxRow;
