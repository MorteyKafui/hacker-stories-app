import axios from 'axios';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import './App.css';

type Story = {
  objectID: string;
  url: string;
  title: string;
  author: string;
  num_comments: number;
  points: number;
};

type ItemProps = {
  item: Story;
  onRemoveItem: (item: Story) => void;
};

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

const useStorageState = (
  key: string,
  initialState: string
): [string, (newValue: string) => void] => {
  const [value, setValue] = useState(localStorage.getItem(key) || initialState);

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const App = () => {
  const [searchTerm, setSearchTerm] = useStorageState('search', 'React');
  const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`);

  const [stories, dispatchStories] = useReducer(storiesReducer, {
    data: [],
    loading: false,
    error: false,
  });

  const handleFetchStories = useCallback(async () => {
    dispatchStories({
      type: 'STORIES_FETCH_INIT',
    });

    try {
      const result = await axios.get(url);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' });
    }
  }, [url]);

  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleSearchInput = e => {
    setSearchTerm(e.target.value);
  };

  const searchedStories = stories.data.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveStory = item => {
    dispatchStories({ type: 'REMOVE_STORY', payload: item });
  };

  const handleSearchSubmit = e => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
    e.preventDefault();
  };

  return (
    <div className='container'>
      <h1 className='headline-primary'>My Hacker Stories</h1>
      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <hr />

      {stories.error && <p>Something went wrong...</p>}

      {stories.loading ? (
        <p>Loading...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
    </div>
  );
};

const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => (
  <form onSubmit={onSearchSubmit} className='search-form'>
    <InputWithLabel
      id='search'
      value={searchTerm}
      isFocused
      onInputChange={onSearchInput}
    >
      <strong>Search:</strong>
    </InputWithLabel>
    <button
      type='submit'
      disabled={!searchTerm}
      className='button button_large'
    >
      Submit
    </button>
  </form>
);

const List = ({ list, onRemoveItem }) => {
  return (
    <ul>
      {list.map(item => (
        <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />
      ))}
    </ul>
  );
};

const Item = ({ item, onRemoveItem }: ItemProps) => (
  <>
    <li className='item'>
      <span style={{ width: '40%' }}>
        <a href={item.url}>{item.title}</a>
      </span>
      <span style={{ width: '30%' }}>{item.author}</span>
      <span style={{ width: '10%' }}>{item.num_comments}</span>
      <span style={{ width: '10%' }}>{item.points}</span>
      <span style={{ width: '10%' }}>
        <button
          className='button button_small'
          type='button'
          onClick={() => onRemoveItem(item)}
        >
          Dismiss
        </button>
      </span>
    </li>
  </>
);

const InputWithLabel = ({
  id,
  label,
  value,
  onInputChange,
  children,
  isFocused,
  type = 'text',
}) => {
  const inputRef = useRef();

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);
  return (
    <>
      <label htmlFor={id} className='label'>
        {children}
      </label>
      &nbsp;
      <input
        ref={inputRef}
        type={type}
        id={id}
        onChange={onInputChange}
        value={value}
        className='input'
      />
    </>
  );
};

export default App;
