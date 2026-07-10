import React, { Component } from 'react';

// Battery/WiFi status only exists inside a real Visionect VSS render
// session (window.okular), never in a plain browser (local dev, our own
// tests) - so this is always inert there, not a bug.
function readDeviceStatus() {
  if (typeof window === 'undefined' || !window.okular || typeof window.okular.DevicesStatus !== 'function') {
    return Promise.resolve(null);
  }
  // Promise.resolve() transparently handles DevicesStatus() returning
  // either a plain object or a real promise, since the docs don't say
  // which for certain.
  return Promise.resolve(window.okular.DevicesStatus())
    .then((statusMap) => (statusMap && window.okular.session_uuid) ? statusMap[window.okular.session_uuid] : null)
    .catch(() => null);
}

// Battery/WiFi change slowly - poll rarely to avoid adding to e-ink
// refresh churn for a value that's almost always unchanged.
const POLL_INTERVAL_MS = 15 * 60 * 1000;

const BatteryIcon = ({ percent, charging }) => {
  const level = Math.max(0, Math.min(100, percent));
  const fillWidth = (level / 100) * 20;
  return (
    <svg width="17" height="9" viewBox="0 0 26 14">
      <rect x="1" y="1" width="22" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="24" y="4.5" width="2" height="5" fill="currentColor" />
      <rect x="3" y="3" width={fillWidth} height="8" fill="currentColor" />
      {charging &&
        <polygon points="13,2.5 8.5,8 12,8 10.5,11.5 16,6 12.5,6" fill="white" stroke="currentColor" strokeWidth="0.5" />
      }
    </svg>
  );
};

const SignalIcon = ({ percent }) => {
  const bars = 4;
  const filledBars = Math.max(1, Math.ceil((Math.max(0, Math.min(100, percent)) / 100) * bars));
  const barWidth = 4, gap = 2, maxHeight = 14;
  const width = bars * barWidth + (bars - 1) * gap;
  return (
    <svg width={width * 0.65} height={maxHeight * 0.65} viewBox={`0 0 ${width} ${maxHeight}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = ((i + 1) / bars) * maxHeight;
        return (
          <rect key={i}
            x={i * (barWidth + gap)}
            y={maxHeight - h}
            width={barWidth}
            height={h}
            fill={i < filledBars ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1" />
        );
      })}
    </svg>
  );
};

class DeviceStatus extends Component {
  constructor(props) {
    super(props);
    this.state = { status: null };
  }

  check = () => {
    readDeviceStatus().then((status) => this.setState({ status }));
    this.timerID = setTimeout(this.check, POLL_INTERVAL_MS);
  }

  componentDidMount = () => {
    this.check();
  }

  componentWillUnmount = () => {
    clearTimeout(this.timerID);
  }

  render() {
    const { status } = this.state;
    if (!status) return null;

    const battery = status.Battery;
    // RSSI here is Visionect's own positive signal-quality value (0-100ish),
    // not literal dBm (which would be negative) - confirmed against real
    // device output.
    const signal = status.RSSI;
    const charging = !!status.Charger;

    return (
      <div id="single-room__device-status">
        {typeof battery === 'number' &&
          <span id="single-room__battery">
            <BatteryIcon percent={battery} charging={charging} />
            {battery}%
          </span>
        }
        {typeof signal === 'number' &&
          <span id="single-room__signal">
            <SignalIcon percent={signal} />
            {signal}%
          </span>
        }
      </div>
    );
  }
}

export default DeviceStatus;
