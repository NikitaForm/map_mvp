import { useState, useRef } from 'react';
import * as React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2, Undo, Save, Edit3 } from 'lucide-react';

// Component to handle map clicks for drawing
function DrawingHandler({isDrawing, onAddPoint}) {
    useMapEvents({
        click: (e) => {
            if (isDrawing) {
                onAddPoint([e.latlng.lat, e.latlng.lng]);
            }
        },
    });
    return null;
}

const ChangeView = ({center}: { center: [number, number] }) => {
    const map = useMap();
    map.setView(center);
    return null;
};

export default function PolygonDrawingMap() {
    const [polygons, setPolygons] = useState([]);
    const [currentPoints, setCurrentPoints] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedPolygon, setSelectedPolygon] = useState(null);
    const mapRef = useRef(null);

    const center = [51.505, -0.09]; // Default center (London)

    const startDrawing = () => {
        setIsDrawing(true);
        setCurrentPoints([]);
        setSelectedPolygon(null);
    };

    const addPoint = (point) => {
        setCurrentPoints([...currentPoints, point]);
    };

    const undoLastPoint = () => {
        if (currentPoints.length > 0) {
            setCurrentPoints(currentPoints.slice(0, -1));
        }
    };

    const finishPolygon = () => {
        if (currentPoints.length >= 3) {
            const newPolygon = {
                id: Date.now(),
                points: currentPoints,
                color: getRandomColor(),
            };
            setPolygons([...polygons, newPolygon]);
            setCurrentPoints([]);
            setIsDrawing(false);
        } else {
            alert('A polygon needs at least 3 points!');
        }
    };

    const cancelDrawing = () => {
        setCurrentPoints([]);
        setIsDrawing(false);
    };

    const deletePolygon = (id) => {
        setPolygons(polygons.filter(p => p.id !== id));
        if (selectedPolygon === id) {
            setSelectedPolygon(null);
        }
    };

    const deleteAllPolygons = () => {
        if (window.confirm('Delete all polygons?')) {
            setPolygons([]);
            setSelectedPolygon(null);
        }
    };

    const getRandomColor = () => {
        const colors = ['#3388ff', '#ff3333', '#33ff33', '#ffff33', '#ff33ff', '#33ffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const calculateArea = (points) => {
        if (points.length < 3) return 0;

        // Simple area calculation (approximate, in square meters)
        let area = 0;
        const earthRadius = 6371000; // meters

        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const lat1 = points[i][0] * Math.PI / 180;
            const lat2 = points[j][0] * Math.PI / 180;
            const lng1 = points[i][1] * Math.PI / 180;
            const lng2 = points[j][1] * Math.PI / 180;

            area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
        }

        area = Math.abs(area * earthRadius * earthRadius / 2);
        return area;
    };

    const formatArea = (area) => {
        if (area < 10000) {
            return `${area.toFixed(2)} m²`;
        } else {
            return `${(area / 1000000).toFixed(2)} km²`;
        }
    };

    return (
        <div style={styles.container}>
            <style>{`
        .polygon-card {
          transition: all 0.3s ease;
        }
        .polygon-card.selected {
          box-shadow: 0 0 0 2px #60a5fa;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

            {/* Sidebar */}
            <div style={styles.sidebar}>
                <h1 style={styles.title}>Polygon Drawing Tool</h1>

                {/* Drawing Controls */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Drawing Controls</h2>

                    {!isDrawing ? (
                        <button onClick={startDrawing} style={styles.primaryButton}>
                            <Edit3 size={18}/>
                            <span style={styles.buttonText}>Start Drawing</span>
                        </button>
                    ) : (
                        <div style={styles.buttonGroup}>
                            <div style={styles.infoText}>
                                Click on the map to add points ({currentPoints.length} points)
                            </div>

                            <button
                                onClick={undoLastPoint}
                                disabled={currentPoints.length === 0}
                                style={{
                                    ...styles.button,
                                    ...styles.warningButton,
                                    ...(currentPoints.length === 0 ? styles.disabledButton : {})
                                }}
                            >
                                <Undo size={18}/>
                                <span style={styles.buttonText}>Undo Last Point</span>
                            </button>

                            <button
                                onClick={finishPolygon}
                                disabled={currentPoints.length < 3}
                                style={{
                                    ...styles.button,
                                    ...styles.successButton,
                                    ...(currentPoints.length < 3 ? styles.disabledButton : {})
                                }}
                            >
                                <Save size={18}/>
                                <span style={styles.buttonText}>Finish Polygon</span>
                            </button>

                            <button onClick={cancelDrawing} style={{...styles.button, ...styles.dangerButton}}>
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Polygons List */}
                <div>
                    <div style={styles.listHeader}>
                        <h2 style={styles.sectionTitle}>Polygons ({polygons.length})</h2>
                        {polygons.length > 0 && (
                            <button onClick={deleteAllPolygons} style={styles.deleteAllButton}>
                                Delete All
                            </button>
                        )}
                    </div>

                    {polygons.length === 0 ? (
                        <div style={styles.emptyState}>No polygons yet. Start drawing!</div>
                    ) : (
                        <div style={styles.polygonList}>
                            {polygons.map((polygon) => (
                                <div
                                    key={polygon.id}
                                    className={`polygon-card ${selectedPolygon === polygon.id ? 'selected' : ''}`}
                                    style={styles.polygonCard}
                                    onClick={() => setSelectedPolygon(polygon.id)}
                                >
                                    <div style={styles.polygonHeader}>
                                        <div style={styles.polygonInfo}>
                                            <div
                                                style={{
                                                    ...styles.colorBox,
                                                    backgroundColor: polygon.color
                                                }}
                                            />
                                            <span style={styles.polygonTitle}>Polygon #{polygon.id}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deletePolygon(polygon.id);
                                            }}
                                            style={styles.deleteButton}
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>

                                    <div style={styles.polygonDetails}>
                                        <div>Points: {polygon.points.length}</div>
                                        <div>Area: {formatArea(calculateArea(polygon.points))}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {selectedPolygon && <div style={styles.infoSection}>
                    <h3 style={styles.infoTitle}>Selected polygon details:</h3>
                    <ul style={styles.infoList}>
                        {polygons.find(pol => pol.id === selectedPolygon)?.points?.map((p, i) => {
                            return <li key={i}>[{p[0].toFixed(5)}, {p[1].toFixed(5)}]</li>
                        })}
                    </ul>
                </div>}

                {/* Info */}
                <div style={styles.infoSection}>
                    <h3 style={styles.infoTitle}>How to use:</h3>
                    <ul style={styles.infoList}>
                        <li>• Click "Start Drawing" to begin</li>
                        <li>• Click on the map to add points</li>
                        <li>• Use "Undo" to remove last point</li>
                        <li>• Click "Finish" when done (min 3 points)</li>
                        <li>• Click on polygons in the list to highlight them</li>
                    </ul>
                </div>
            </div>

            {/* Map */}
            <div style={styles.mapContainer}>
                <MapContainer
                    center={center}
                    zoom={13}
                    style={styles.map}
                    ref={mapRef}
                >
                    <ChangeView
                        center={center}
                    />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <DrawingHandler isDrawing={isDrawing} onAddPoint={addPoint}/>

                    {/* Render existing polygons */}
                    {polygons.map((polygon) => (
                        <Polygon
                            key={polygon.id}
                            positions={polygon.points}
                            pathOptions={{
                                color: polygon.color,
                                fillColor: polygon.color,
                                fillOpacity: selectedPolygon === polygon.id ? 0.5 : 0.3,
                                weight: selectedPolygon === polygon.id ? 3 : 2,
                            }}
                            eventHandlers={{
                                click: () => setSelectedPolygon(polygon.id),
                            }}
                        />
                    ))}

                    {/* Render current drawing points */}
                    {currentPoints.map((point, index) => (
                        <Marker key={index} position={point}/>
                    ))}

                    {/* Render current polygon preview */}
                    {currentPoints.length >= 2 && (
                        <Polygon
                            positions={currentPoints}
                            pathOptions={{
                                color: '#3388ff',
                                fillColor: '#3388ff',
                                fillOpacity: 0.2,
                                dashArray: '5, 5',
                                weight: 2,
                            }}
                        />
                    )}
                </MapContainer>

                {/* Drawing indicator */}
                {isDrawing && (
                    <div style={styles.drawingIndicator}>
                        <div style={styles.indicatorContent}>
                            <div className="pulse" style={styles.pulseCircle}/>
                            Drawing mode active - Click on the map to add points
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        width: '100wh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    sidebar: {
        width: '320px',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '16px',
        overflowY: 'auto'
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '24px',
        marginTop: 0
    },
    section: {
        marginBottom: '24px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '12px',
        marginTop: 0
    },
    button: {
        width: '100%',
        fontWeight: '500',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        transition: 'background-color 0.2s'
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#2563eb',
        color: 'white',
        fontWeight: '500',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        transition: 'background-color 0.2s'
    },
    warningButton: {
        backgroundColor: '#ca8a04',
        color: 'white'
    },
    successButton: {
        backgroundColor: '#16a34a',
        color: 'white'
    },
    dangerButton: {
        backgroundColor: '#dc2626',
        color: 'white'
    },
    disabledButton: {
        backgroundColor: '#4b5563',
        cursor: 'not-allowed',
        opacity: 0.6
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    buttonText: {
        display: 'inline'
    },
    infoText: {
        fontSize: '14px',
        color: '#d1d5db',
        marginBottom: '8px'
    },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    deleteAllButton: {
        color: '#f87171',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'color 0.2s'
    },
    emptyState: {
        color: '#9ca3af',
        fontSize: '14px'
    },
    polygonList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    polygonCard: {
        backgroundColor: '#374151',
        padding: '12px',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    polygonHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
    },
    polygonInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    colorBox: {
        width: '16px',
        height: '16px',
        borderRadius: '4px'
    },
    polygonTitle: {
        fontWeight: '500'
    },
    deleteButton: {
        color: '#f87171',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.2s'
    },
    polygonDetails: {
        fontSize: '14px',
        color: '#d1d5db',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    infoSection: {
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #4b5563'
    },
    infoTitle: {
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '8px',
        marginTop: 0
    },
    infoList: {
        fontSize: '12px',
        color: '#d1d5db',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    mapContainer: {
        flex: 1,
        width: '600px',
        position: 'relative'
    },
    map: {
        height: '100%',
        width: '100%'
    },
    drawingIndicator: {
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
    },
    indicatorContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    pulseCircle: {
        width: '12px',
        height: '8px',
        backgroundColor: 'red',
        borderRadius: '50%'
    }
};
