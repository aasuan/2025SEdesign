package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.User;

@Mapper
public interface UserMapper {

    User selectById(@Param("id") Integer id);

    User selectByUsername(@Param("username") String username);

    int insert(User user);
}

