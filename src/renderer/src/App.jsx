import { useEffect, useReducer } from 'react';
import Loader from './loader/Loader';
const initialValue = {
  status: 'Checking For Updates...'
};
const reducer = function (state, action) {
  switch (action.type) {
    case 'setStatus': {
      return { ...state, status: action.payload };
    }
    default:
      return new Error('method not found');
  }
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialValue);

  useEffect(function () {
    document.body.classList = 'dark';
  }, []);
  return (
    <>
      <Loader {...state} dispatch={dispatch} />
    </>
  );
}
