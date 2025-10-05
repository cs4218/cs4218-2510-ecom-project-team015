import React, {useState, useEffect} from 'react'
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';
import { useAuth } from '../../context/auth';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import moment from "moment";


const Users = () => {
  const [users, setUsers] = useState([]);
  const [auth, setAuth] = useAuth();

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/all-users");
      setUsers(data);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data.message || "Error fetching all users");
    }
  };
  useEffect(() => {
    if (auth?.token) getUsers();
  }, [auth?.token]);

  return (
    <Layout title={"Dashboard - All Users"}>
        <div className="container-fluid m-3 p-3">
          <div className="row">
            <div className="col-md-3">
              <AdminMenu />
            </div>
            <div className="col-md-9">
              <h1>All Users</h1>
                  <div className="border shadow">
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Name</th>
                          <th scope="col">Email</th>
                          <th scope="col">Account Creation</th>
                          <th scope="col">Phone</th>
                          <th scope="col">Address</th>
                          <th scope="col">DOB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, index) => (
                          <tr key={user._id}>
                            <td>{index + 1}</td>
                            <td>{user?.name}</td>
                            <td>{user?.email}</td>
                            <td>{moment(user?.createdAt).fromNow()}</td>
                            <td>{user?.phone}</td>
                            <td>{user?.address}</td>
                            <td>{new Date(user?.DOB).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            </div>
          </div> 
        </div>
    </Layout>
  );
};

export default Users;