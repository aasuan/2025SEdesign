package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.User;

@Mapper
public interface UserMapper {

    User selectById(@Param("id") Long id);

    User selectByUsername(@Param("username") String username);

    User selectByEmail(@Param("email") String email);

    User selectByPhone(@Param("phone") String phone);

    int insert(User user);

    int updatePhone(@Param("id") Long id, @Param("phone") String phone);
}

