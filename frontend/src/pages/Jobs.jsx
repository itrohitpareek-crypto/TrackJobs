import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";


import {
  useSearchParams,
} from "react-router-dom";


import api from "../services/api";


import JobCard from "../components/JobCard";


import {
  useAuth,
} from "../context/AuthContext";


export default function Jobs() {

  const [
    searchParams,
  ] = useSearchParams();


  const {
    user,
  } = useAuth();


  const [
    jobs,
    setJobs,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    savedIds,
    setSavedIds,
  ] = useState(
    new Set()
  );


  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);


  const [
    filters,
    setFilters,
  ] = useState({
    q:
      searchParams.get(
        "q"
      ) || "",

    location:
      searchParams.get(
        "location"
      ) || "",

    type: "",

    workMode: "",

    experienceMin: "",

    experienceMax: "",

    salaryMin: "",

    salaryMax: "",

    skills: "",
  });


  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(
    filters
  );


  const loadSavedJobs =
    async () => {

      if (
        !user ||
        user.role !==
          "candidate"
      ) {
        return;
      }


      try {
        const response =
          await api.get(
            "/jobs/saved/list"
          );


        const ids =
          new Set(
            (
              response.data
                .jobs ||
              response.data ||
              []
            ).map(
              (job) =>
                job._id
            )
          );


        setSavedIds(ids);
      } catch (error) {
        console.error(
          "Saved jobs error:",
          error
        );
      }
    };


  const loadJobs =
    async () => {

      setLoading(true);


      try {
        const response =
          await api.get(
            "/jobs",
            {
              params:
                appliedFilters,
            }
          );


        setJobs(
          response.data.jobs ||
            []
        );
      } catch (error) {
        console.error(
          "Jobs error:",
          error
        );

        setJobs([]);
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadSavedJobs();
  }, [user]);


  useEffect(() => {
    loadJobs();
  }, [appliedFilters]);


  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value,
      } = event.target;


      setFilters(
        (
          previous
        ) => ({
          ...previous,
          [name]:
            value,
        })
      );
    };


  const applyFilters =
    (
      event
    ) => {

      event.preventDefault();


      setAppliedFilters(
        filters
      );
    };


  const clearFilters =
    () => {

      const cleared = {
        q: "",
        location: "",
        type: "",
        workMode: "",
        experienceMin:
          "",
        experienceMax:
          "",
        salaryMin: "",
        salaryMax: "",
        skills: "",
      };


      setFilters(
        cleared
      );


      setAppliedFilters(
        cleared
      );
    };


  const handleSavedChange =
    (
      id,
      saved
    ) => {

      setSavedIds(
        (
          previous
        ) => {

          const next =
            new Set(
              previous
            );


          if (saved) {
            next.add(id);
          } else {
            next.delete(id);
          }


          return next;
        }
      );
    };


  const activeFilterCount =
    useMemo(() => {

      return Object.entries(
        appliedFilters
      ).filter(
        (
          [
            key,
            value,
          ]
        ) =>
          key !==
            "q" &&
          value
      ).length;

    }, [
      appliedFilters,
    ]);


  return (
    <main className="container jobs-page">

      <section className="jobs-heading">

        <div>

          <span className="eyebrow">
            Explore opportunities
          </span>

          <h1>
            Find your next role.
          </h1>

          <p>
            Discover roles from
            growing teams and
            established companies.
          </p>

        </div>


        <div className="jobs-result-summary">

          <strong>
            {jobs.length}
          </strong>

          <span>
            opportunities
          </span>

        </div>

      </section>


      <form
        className="advanced-job-search"
        onSubmit={
          applyFilters
        }
      >

        <div className="searchbox jobs-main-search">

          <Search
            size={20}
          />

          <input
            name="q"
            value={
              filters.q
            }
            onChange={
              handleChange
            }
            placeholder="Search title, skills, company..."
          />

        </div>


        <div className="search-location">

          <input
            name="location"
            value={
              filters.location
            }
            onChange={
              handleChange
            }
            placeholder="Location"
          />

        </div>


        <button
          type="button"
          className="filter-btn"
          onClick={() =>
            setFiltersOpen(
              !filtersOpen
            )
          }
        >

          <SlidersHorizontal
            size={17}
          />

          Filters

          {activeFilterCount >
            0 && (
            <span className="filter-count">
              {activeFilterCount}
            </span>
          )}

        </button>


        <button
          type="submit"
          className="btn jobs-search-btn"
        >
          Search Jobs
        </button>

      </form>


      {filtersOpen && (

        <section className="advanced-filter-panel">

          <div className="filter-panel-head">

            <div>

              <strong>
                Refine your search
              </strong>

              <span>
                Find roles that match
                your preferences.
              </span>

            </div>


            <button
              type="button"
              className="filter-close"
              onClick={() =>
                setFiltersOpen(
                  false
                )
              }
            >

              <X
                size={18}
              />

            </button>

          </div>


          <div className="advanced-filter-grid">

            <label>
              <span>
                Job type
              </span>

              <select
                name="type"
                value={
                  filters.type
                }
                onChange={
                  handleChange
                }
              >

                <option value="">
                  All types
                </option>

                <option>
                  Full-time
                </option>

                <option>
                  Part-time
                </option>

                <option>
                  Contract
                </option>

                <option>
                  Internship
                </option>

              </select>
            </label>


            <label>
              <span>
                Work mode
              </span>

              <select
                name="workMode"
                value={
                  filters.workMode
                }
                onChange={
                  handleChange
                }
              >

                <option value="">
                  All modes
                </option>

                <option>
                  On-site
                </option>

                <option>
                  Hybrid
                </option>

                <option>
                  Remote
                </option>

              </select>
            </label>


            <label>
              <span>
                Min experience
              </span>

              <select
                name="experienceMin"
                value={
                  filters.experienceMin
                }
                onChange={
                  handleChange
                }
              >

                <option value="">
                  Any
                </option>

                <option value="0">
                  0 years
                </option>

                <option value="1">
                  1+ years
                </option>

                <option value="2">
                  2+ years
                </option>

                <option value="3">
                  3+ years
                </option>

                <option value="5">
                  5+ years
                </option>

              </select>
            </label>


            <label>
              <span>
                Max experience
              </span>

              <select
                name="experienceMax"
                value={
                  filters.experienceMax
                }
                onChange={
                  handleChange
                }
              >

                <option value="">
                  Any
                </option>

                <option value="1">
                  1 year
                </option>

                <option value="2">
                  2 years
                </option>

                <option value="3">
                  3 years
                </option>

                <option value="5">
                  5 years
                </option>

                <option value="10">
                  10 years
                </option>

              </select>
            </label>


            <label>
              <span>
                Minimum salary
              </span>

              <input
                type="number"
                name="salaryMin"
                value={
                  filters.salaryMin
                }
                onChange={
                  handleChange
                }
                placeholder="₹0"
              />
            </label>


            <label>
              <span>
                Maximum salary
              </span>

              <input
                type="number"
                name="salaryMax"
                value={
                  filters.salaryMax
                }
                onChange={
                  handleChange
                }
                placeholder="₹20,00,000"
              />
            </label>


            <label className="filter-wide">
              <span>
                Skills
              </span>

              <input
                name="skills"
                value={
                  filters.skills
                }
                onChange={
                  handleChange
                }
                placeholder="React, Node.js, MongoDB"
              />
            </label>


            <div className="filter-actions">

              <button
                type="button"
                className="outline"
                onClick={
                  clearFilters
                }
              >
                Clear all
              </button>


              <button
                type="submit"
                className="btn"
                onClick={() =>
                  setFiltersOpen(
                    false
                  )
                }
              >
                Apply filters
              </button>

            </div>

          </div>

        </section>

      )}


      <div className="jobs-list-head">

        <div>

          <span className="eyebrow">
            Latest opportunities
          </span>

          <h2>
            {jobs.length} roles
            available
          </h2>

        </div>


        {activeFilterCount >
          0 && (

          <button
            type="button"
            className="clear-filter-inline"
            onClick={
              clearFilters
            }
          >

            Clear filters

            <X
              size={14}
            />

          </button>

        )}

      </div>


      {loading ? (

        <div className="jobs-loading-grid">

          {Array.from(
            {
              length: 6,
            }
          ).map(
            (
              _,
              index
            ) => (

              <div
                className="job-skeleton"
                key={index}
              />

            )
          )}

        </div>

      ) : jobs.length > 0 ? (

        <div className="job-grid premium-job-grid">

          {jobs.map(
            (
              job
            ) => (

              <JobCard
                key={
                  job._id
                }
                job={
                  job
                }
                initialSaved={
                  savedIds.has(
                    job._id
                  )
                }
                onSavedChange={
                  handleSavedChange
                }
              />

            )
          )}

        </div>

      ) : (

        <div className="empty jobs-empty">

          <Search
            size={36}
          />

          <h3>
            No matching jobs
          </h3>

          <p>
            Try changing your
            search or clearing
            some filters.
          </p>


          <button
            type="button"
            className="btn"
            onClick={
              clearFilters
            }
          >
            Clear filters
          </button>

        </div>

      )}

    </main>
  );
}