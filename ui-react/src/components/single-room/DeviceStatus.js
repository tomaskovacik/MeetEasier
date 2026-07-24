import React, { Component } from 'react';

// Battery/WiFi status only exists inside a real Visionect VSS render
// session (window.okular) - resolves to null everywhere else (local dev,
// our own tests, plain browsers), and the caller falls back to a zeroed
// default in that case.
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
const POLL_INTERVAL_MS = 60 * 60 * 1000;

// Rounded to the nearest percent point so near-identical battery readings
// (e.g. 55 vs 55.4) compare equal - see iconState() below, which uses this
// same value to decide whether a re-render is needed at all.
const batteryFillWidth = (percent) => {
  const level = Math.max(0, Math.min(100, Math.round(percent)));
  return (level / 100) * 20;
};

const SIGNAL_BARS = 4;

// Signal is rendered as discrete bars, so this is also the value iconState()
// compares - many different RSSI readings map to the same bar count and
// shouldn't cause a re-render.
const signalFilledBars = (percent) =>
  Math.max(1, Math.ceil((Math.max(0, Math.min(100, percent)) / 100) * SIGNAL_BARS));

const BatteryIcon = ({ percent, charging }) => {
  const fillWidth = batteryFillWidth(percent);
  return (
    <svg className="single-room__battery-icon" viewBox="0 0 26 14">
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
  const filledBars = signalFilledBars(percent);
  const bars = SIGNAL_BARS;
  const barWidth = 4, gap = 2, maxHeight = 14;
  const width = bars * barWidth + (bars - 1) * gap;
  return (
    <svg className="single-room__signal-icon" viewBox={`0 0 ${width} ${maxHeight}`}>
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

// Shown until real data arrives (or forever, outside a real VSS session) -
// this branch only ever runs on the Joan hardware, so defaulting to a
// visible zeroed-out icon rather than hiding is deliberate: it makes
// layout/sizing easy to check anywhere, not just on-device.
const DEFAULT_STATUS = { Battery: 0, RSSI: 0, Charger: 0 };

// Reduces a raw status to exactly what the icons visually depend on, so a
// poll that changes Battery/RSSI without changing what's drawn (e.g. 55 -> 56,
// or an RSSI move that stays within the same signal bar) doesn't trigger a
// re-render - each render is a write to the e-ink screen, so those are
// worth avoiding.
function iconState(status) {
  const battery = status.Battery;
  const signal = status.RSSI;
  return {
    battery: typeof battery === 'number' ? batteryFillWidth(battery) : null,
    charging: !!status.Charger,
    signal: typeof signal === 'number' ? signalFilledBars(signal) : null,
  };
}

function iconStateEqual(a, b) {
  return a.battery === b.battery && a.charging === b.charging && a.signal === b.signal;
}

class DeviceStatus extends Component {
  constructor(props) {
    super(props);
    this.state = { status: DEFAULT_STATUS };
  }

  check = () => {
    readDeviceStatus().then((status) => this.setState({ status: status || DEFAULT_STATUS }));
    this.timerID = setTimeout(this.check, POLL_INTERVAL_MS);
  }

  componentDidMount = () => {
    this.check();
  }

  componentWillUnmount = () => {
    clearTimeout(this.timerID);
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    return !iconStateEqual(iconState(this.state.status), iconState(nextState.status));
  }

  render() {
    const { status } = this.state;

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
          </span>
        }
        {typeof signal === 'number' &&
          <span id="single-room__signal">
            <SignalIcon percent={signal} />
          </span>
        }
      </div>
    );
  }
}

export default DeviceStatus;
