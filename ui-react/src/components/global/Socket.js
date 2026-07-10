import React, { Component } from 'react';
import PropTypes from 'prop-types';
import socketIOClient from 'socket.io-client';

class Socket extends Component {
  componentDidMount = () => {
    const socket = socketIOClient();

    socket.on('updatedRooms', (rooms) => {
      this.props.response({
        response: true,
        now: new Date(),
        rooms: rooms
      });
    });

    socket.on('dataSource', (dataSource) => {
      if (this.props.onDataSource) this.props.onDataSource(dataSource);
    });
  }

  componentWillUnmount = () => {
    const socket = socketIOClient();
    socket.close();
  }

  render() {
    return null;
  }
}

Socket.propTypes = {
  response: PropTypes.func,
  onDataSource: PropTypes.func
}

export default Socket;
